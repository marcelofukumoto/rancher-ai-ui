import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { HistoryPo } from '@/cypress/e2e/po/history.po';
import DeleteChatPromptPo from '@/cypress/e2e/po/dialog/delete-chat.po';

describe('Keyboard Shortcuts', () => {
  const chat = new ChatPo();
  const history = new HistoryPo();
  const isMac = Cypress.platform === 'darwin';

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.login();
    cy.clearLLMResponses();
    HomePagePo.goTo();
  });

  afterEach(() => {
    cy.cleanChatHistory();
  });

  it('Test 1: Open and close chat panel (Alt+K / Cmd+Shift+K)', () => {
    // Open chat via keyboard shortcut
    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');
    chat.isOpen();
    cy.screenshot('01-chat-opened');

    // Close chat via keyboard shortcut
    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');
    chat.isClosed();
    cy.screenshot('02-chat-closed');
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

    cy.screenshot('03-before-new-chat');

    // Trigger new chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}o' : '{ctrl}{shift}o');

    cy.wait(500);

    // Chat should reset to welcome state — message 1 is the welcome message
    const welcomeMessage = chat.getMessage(1);

    welcomeMessage.isCompleted();
    cy.screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    // Open history via shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    cy.wait(500);
    history.isOpen();
    cy.screenshot('05-history-opened');

    // Close history via shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    cy.wait(500);
    history.isClosed();
    cy.screenshot('06-history-closed');
  });

  it('Test 4: Copy Last Response (Ctrl+Shift+C)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Copy this response.' });
    chat.sendMessage('Tell me something');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Trigger copy shortcut — no error expected, UI remains stable
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}c' : '{ctrl}{shift}c');

    cy.wait(500);
    chat.isOpen();
    cy.screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Message to be deleted.' });
    chat.sendMessage('Delete me');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Trigger delete shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}{backspace}' : '{ctrl}{shift}{backspace}');

    cy.wait(500);

    // Delete modal should appear
    const deletePrompt = new DeleteChatPromptPo();

    cy.screenshot('08-delete-modal');

    deletePrompt.confirm();

    cy.wait(500);

    // Chat should be reset to welcome state
    chat.getMessage(1).isCompleted();
    cy.screenshot('09-after-delete');
  });

  it('Test 6: Prompt History Navigation (ArrowUp / ArrowDown / Tab)', () => {
    chat.open();
    chat.isReady();

    // Send 3 messages
    const messages = ['First message', 'Second message', 'Third message'];

    for (const msg of messages) {
      cy.enqueueLLMResponse({ text: `Response to: ${ msg }` });
      chat.sendMessage(msg);

      // Wait for response to complete before sending next
      const responseIndex = (messages.indexOf(msg) + 1) * 2 + 1;

      chat.getMessage(responseIndex).isCompleted();
    }

    // Focus textarea and navigate up
    const textarea = cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]');

    textarea.click();
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{uparrow}');
    cy.wait(300);
    cy.screenshot('10-arrow-up');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{uparrow}');
    cy.wait(300);
    cy.screenshot('11-arrow-up-twice');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{downarrow}');
    cy.wait(300);
    cy.screenshot('12-arrow-down');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{tab}', { force: true });
    cy.wait(300);
    cy.screenshot('13-tab-accepted');

    // Textarea should have content after navigation
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .invoke('val')
      .should('not.be.empty');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    // Click the chat menu button (icon-actions button in the header)
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.chat-console-menu-container button')
      .first()
      .click();

    cy.wait(300);
    cy.screenshot('14-menu-opened');

    // Click "Keyboard Shortcuts" menu item
    cy.contains('Keyboard Shortcuts').click({ force: true });
    cy.wait(300);

    // The shortcuts popover should be visible
    cy.get('.shortcuts').should('be.visible');
    cy.screenshot('15-shortcuts-popover');
  });
});
