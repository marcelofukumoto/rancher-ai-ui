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
    HomePagePo.goTo();
  });

  afterEach(() => {
    cy.cleanChatHistory();
  });

  it('Test 1: Open / Close Chat Panel (Alt+K / ⌘+Shift+K)', () => {
    // Open chat panel using keyboard shortcut
    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');

    chat.isOpen();
    chat.isReady();

    cy.screenshot('01-chat-opened');

    // Close chat panel using keyboard shortcut
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

    cy.wait(500);

    // Trigger new chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}o' : '{ctrl}{shift}o');

    // After new chat, only the welcome message (id=1) should be present
    chat.getMessage(1).isCompleted();

    cy.screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    cy.wait(500);

    // Open history via shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    history.isOpen();

    cy.screenshot('05-history-opened');

    cy.wait(500);

    // Close history via shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    history.isClosed();

    cy.screenshot('06-history-closed');
  });

  it('Test 4: Copy Last Response (Ctrl+Shift+C)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Response to copy.' });
    chat.sendMessage('Give me a response');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    cy.wait(500);

    // Trigger copy last response shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}c' : '{ctrl}{shift}c');

    // UI should remain stable — no crash or error
    chat.isReady();

    cy.screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'A response before delete.' });
    chat.sendMessage('Message to delete');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    cy.wait(500);

    // Trigger delete chat shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}{backspace}' : '{ctrl}{shift}{backspace}');

    // Delete modal should appear
    cy.get('[data-testid="card"].prompt-remove').should('be.visible');

    cy.screenshot('08-delete-modal');

    // Confirm deletion
    new DeleteChatPromptPo().confirm();

    // After deletion the chat should reset to welcome state
    chat.isReady();
    chat.getMessage(1).isCompleted();

    cy.screenshot('09-after-delete');
  });

  it('Test 6: Prompt History Navigation (ArrowUp / ArrowDown / Tab)', () => {
    chat.open();
    chat.isReady();

    const messages = [
      { request: 'First message', response: 'Response one' },
      { request: 'Second message', response: 'Response two' },
      { request: 'Third message', response: 'Response three' },
    ];

    for (let i = 0; i < messages.length; i++) {
      cy.enqueueLLMResponse({ text: messages[i].response });
      chat.sendMessage(messages[i].request);

      const userMessage = chat.getMessage(2 + i * 2);

      userMessage.containsText(messages[i].request);

      const responseMessage = chat.getMessage(3 + i * 2);

      responseMessage.isCompleted();
    }

    const textarea = cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]');

    textarea.click();

    // Navigate up through prompt history
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{uparrow}');
    cy.wait(200);

    cy.screenshot('10-arrow-up');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{uparrow}');
    cy.wait(200);

    cy.screenshot('11-arrow-up-twice');

    // Navigate back down
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{downarrow}');
    cy.wait(200);

    cy.screenshot('12-arrow-down');

    // Accept suggestion with Tab
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{tab}', { force: true });
    cy.wait(200);

    cy.screenshot('13-tab-accepted');

    // Textarea should have content after navigation
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').invoke('val').should('not.be.empty');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    // Click the menu button (⋮ actions icon in header)
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.icon-actions')
      .closest('button, [role="button"], .rc-dropdown-trigger')
      .first()
      .click({ force: true });

    cy.screenshot('14-menu-opened');

    // Click the "View Keyboard Shortcuts" menu item
    cy.contains('Keyboard Shortcuts').click({ force: true });

    // Shortcuts popover / panel should be visible
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.shortcuts')
      .should('be.visible');

    cy.screenshot('15-shortcuts-popover');
  });
});
