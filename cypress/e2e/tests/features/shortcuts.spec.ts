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

  it('Test 1: Open / Close Chat Panel (Alt+K / Cmd+Shift+K)', () => {
    // Press shortcut to open chat
    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');

    chat.isOpen();
    cy.screenshot('01-chat-opened');

    // Press shortcut again to close chat
    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');

    chat.isClosed();
    cy.screenshot('02-chat-closed');
  });

  it('Test 2: New Chat (Ctrl+Shift+O)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    cy.screenshot('03-before-new-chat');

    // Press Ctrl+Shift+O to start a new chat
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}o' : '{ctrl}{shift}o');

    // Chat should reset — welcome message is first
    chat.isReady();
    const welcomeMessage = chat.getMessage(1);

    welcomeMessage.isCompleted();

    // The second message should not exist (chat was reset)
    chat.getMessage(2).checkNotExists();

    cy.screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    // Press Ctrl+Shift+S to open history
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    cy.wait(500);
    history.isOpen();
    cy.screenshot('05-history-opened');

    // Press Ctrl+Shift+S again to close history
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    cy.wait(500);
    history.isClosed();
    cy.screenshot('06-history-closed');
  });

  it('Test 4: Copy Last Response (Ctrl+Shift+C)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Response to copy.' });
    chat.sendMessage('Copy test');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Press Ctrl+Shift+C — should not throw, UI should remain stable
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}c' : '{ctrl}{shift}c');

    cy.wait(500);

    // Chat container should still be visible and stable
    chat.isOpen();
    cy.screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Message before delete.' });
    chat.sendMessage('Delete test');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Press Ctrl+Shift+Backspace to trigger delete
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}{backspace}' : '{ctrl}{shift}{backspace}');

    const deletePrompt = new DeleteChatPromptPo();

    deletePrompt.self().should('be.visible');
    cy.screenshot('08-delete-modal');

    deletePrompt.confirm();

    // After deletion, chat should reset to a new empty chat
    chat.isReady();
    chat.getMessage(1).isCompleted();
    chat.getMessage(2).checkNotExists();
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
    }

    // Wait for last response to complete
    const lastResponse = chat.getMessage(7);

    lastResponse.isCompleted();

    // Focus the textarea
    const textarea = cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]');

    textarea.click();

    // Navigate up twice in prompt history
    textarea.type('{uparrow}');
    cy.wait(200);
    cy.screenshot('10-arrow-up');

    textarea.type('{uparrow}');
    cy.wait(200);
    cy.screenshot('11-arrow-up-twice');

    // Navigate back down once
    textarea.type('{downarrow}');
    cy.wait(200);
    cy.screenshot('12-arrow-down');

    // Accept suggestion with Tab
    textarea.type('{tab}', { force: true });
    cy.wait(200);
    cy.screenshot('13-tab-accepted');

    // Textarea should have some content from prompt history
    textarea.invoke('val').should('not.be.empty');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    // Click the chat header menu button (icon-actions)
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.icon-actions')
      .closest('button')
      .click({ force: true });

    cy.wait(300);
    cy.screenshot('14-menu-opened');

    // Click "View Keyboard Shortcuts" menu item
    cy.contains('View Keyboard Shortcuts').click({ force: true });

    cy.wait(300);

    // The shortcuts popover should be visible with the title
    cy.contains('Keyboard Shortcuts').should('be.visible');
    cy.screenshot('15-shortcuts-popover');
  });
});
