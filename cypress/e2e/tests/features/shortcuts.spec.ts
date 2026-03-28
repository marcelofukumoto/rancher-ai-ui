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
    // Open chat via keyboard shortcut
    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');
    chat.isOpen();
    chat.isReady();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('01-chat-opened');

    // Close chat via keyboard shortcut
    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');
    chat.isClosed();

    cy.wait(500);
    cy.screenshot('02-chat-closed');
  });

  it('Test 2: New Chat (Ctrl+Shift+O)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    const userMessage = chat.getMessage(2);

    userMessage.containsText('Hello');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('03-before-new-chat');

    // Trigger new chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}o' : '{ctrl}{shift}o');

    // Chat should reset to welcome state (only first message)
    chat.getMessage(1).isCompleted();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    // Open history via keyboard shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    history.isOpen();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('05-history-opened');

    // Close history via keyboard shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    history.isClosed();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('06-history-closed');
  });

  it('Test 4: Copy Last Response (Ctrl+Shift+C)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Response to copy.' });
    chat.sendMessage('Please respond');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    // Stub clipboard API to avoid permission errors in headless CI
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}c' : '{ctrl}{shift}c');

    // UI remains stable after copy
    chat.isReady();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Some response.' });
    chat.sendMessage('Some message');

    chat.getMessage(2).containsText('Some message');
    chat.getMessage(3).isCompleted();

    // Trigger delete chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}{backspace}' : '{ctrl}{shift}{backspace}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('08-delete-modal');

    // Confirm deletion
    new DeleteChatPromptPo().confirm();

    // Chat should reset to welcome state
    chat.getMessage(1).isCompleted();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('09-after-delete');
  });

  it('Test 6: Prompt History Navigation (ArrowUp / ArrowDown)', () => {
    chat.open();
    chat.isReady();

    // Send 3 messages and wait for each AI response
    cy.enqueueLLMResponse({ text: 'Response to: First message' });
    chat.sendMessage('First message');
    chat.getMessage(3).isCompleted();

    cy.enqueueLLMResponse({ text: 'Response to: Second message' });
    chat.sendMessage('Second message');
    chat.getMessage(5).isCompleted();

    cy.enqueueLLMResponse({ text: 'Response to: Third message' });
    chat.sendMessage('Third message');
    chat.getMessage(7).isCompleted();

    // Focus textarea and navigate prompt history with ArrowUp.
    // Arrow keys only trigger history navigation when the textarea is empty;
    // the selected history text is shown in the .chat-input-complete overlay,
    // not written to the textarea's value.
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').click().type('{uparrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('10-arrow-up');

    cy.get('[data-testid="rancher-ai-ui-chat-console"] .chat-input-complete .text')
      .should('contain.text', 'Third message');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{uparrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('11-arrow-up-twice');

    cy.get('[data-testid="rancher-ai-ui-chat-console"] .chat-input-complete .text')
      .should('contain.text', 'Second message');

    // Navigate back down
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{downarrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('12-arrow-down');

    cy.get('[data-testid="rancher-ai-ui-chat-console"] .chat-input-complete .text')
      .should('contain.text', 'Third message');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('13-prompt-selected');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    // Click the chat menu button (⋮ actions icon)
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.icon-actions')
      .click();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('14-menu-opened');

    // Click "View Keyboard Shortcuts" option in the dropdown menu
    cy.contains('View Keyboard Shortcuts').click();

    // Verify the keyboard shortcuts popover is visible
    cy.contains('Keyboard Shortcuts').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('15-shortcuts-popover');
  });
});
