import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { HistoryPo } from '@/cypress/e2e/po/history.po';
import DeleteChatPromptPo from '@/cypress/e2e/po/dialog/delete-chat.po';

describe('Keyboard Shortcuts', () => {
  const chat = new ChatPo();
  const history = new HistoryPo();
  const isMac = Cypress.platform === 'darwin';

  before(() => cy.login());

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });

  afterEach(() => cy.cleanChatHistory());

  it('Test 1: Open / Close Chat Panel (Alt+K)', () => {
    // Open chat panel via keyboard shortcut
    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');
    chat.isOpen();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('01-chat-opened');

    // Close chat panel via keyboard shortcut
    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');
    chat.isClosed();

    cy.wait(500);
    cy.get('body').screenshot('02-chat-closed');
  });

  it('Test 2: New Chat (Ctrl+Shift+O)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    const userMessage = chat.getMessage(2);

    userMessage.containsText('Hello');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('03-before-new-chat');

    // Trigger new chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+o}' : '{ctrl+shift+o}');

    // After new chat, only the welcome message should exist
    chat.isReady();
    chat.getMessage(1).isCompleted();
    chat.getMessage(2).checkNotExists();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    // Open history panel via shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+s}' : '{ctrl+shift+s}');

    history.isOpen();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('05-history-opened');

    // Close history panel via shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+s}' : '{ctrl+shift+s}');

    history.isClosed();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('06-history-closed');
  });

  it('Test 4: Copy Last Response (Ctrl+Shift+C)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Stub clipboard API to avoid permission errors in headless CI
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    // Trigger copy last response shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+c}' : '{ctrl+shift+c}');

    // UI should remain stable (no errors thrown)
    chat.isReady();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Trigger delete chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+backspace}' : '{ctrl+shift+backspace}');

    // Delete modal should appear
    const deletePrompt = new DeleteChatPromptPo();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('08-delete-modal');

    // Confirm the deletion
    deletePrompt.confirm();

    // Chat should be reset after deletion
    chat.isReady();
    chat.getMessage(1).isCompleted();
    chat.getMessage(2).checkNotExists();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('09-after-delete');
  });

  it('Test 6: Prompt History Navigation (ArrowUp / ArrowDown)', () => {
    chat.open();
    chat.isReady();

    const messages = ['First message', 'Second message', 'Third message'];

    for (const msg of messages) {
      cy.enqueueLLMResponse({ text: `Response to: ${ msg }` });
      chat.sendMessage(msg);

      const responseMessage = chat.getMessage((messages.indexOf(msg) + 1) * 2 + 1);

      responseMessage.isCompleted();
    }

    const textarea = cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]');

    // Navigate back one step — should show the third (last) message
    textarea.type('{uparrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('10-arrow-up');

    // Navigate back a second step — should show the second message
    textarea.type('{uparrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('11-arrow-up-twice');

    // Verify textarea contains a previously sent message
    textarea.should(($el) => {
      const value = $el.val() as string;

      expect(messages).to.include(value);
    });

    // Navigate forward one step — back to the third message
    textarea.type('{downarrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('12-arrow-down');

    // Verify textarea still contains a previously sent message
    textarea.should(($el) => {
      const value = $el.val() as string;

      expect(messages).to.include(value);
    });

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('13-prompt-selected');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    // Click the header menu button
    cy.get('[data-testid="rancher-ai-ui-chat-menu-button"]').click();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('14-menu-opened');

    // Click "View Keyboard Shortcuts" menu item
    cy.contains('View Keyboard Shortcuts').click();

    // Shortcuts popover should be visible
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .contains('Keyboard Shortcuts')
      .should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('15-shortcuts-popover');
  });
});
