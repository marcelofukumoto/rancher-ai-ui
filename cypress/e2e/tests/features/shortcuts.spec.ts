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

  it('Test 1: Open / Close chat panel (Alt+K)', () => {
    // Open chat with keyboard shortcut
    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');
    chat.isOpen();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('01-chat-opened');

    // Close chat with keyboard shortcut
    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');
    chat.isClosed();

    cy.wait(500);
    cy.get('body').screenshot('02-chat-closed');
  });

  it('Test 2: New Chat (Ctrl+Shift+O)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Response for new chat test.' });
    chat.sendMessage('Hello for new chat test');

    const userMessage = chat.getMessage(2);

    userMessage.containsText('Hello for new chat test');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('03-before-new-chat');

    // Press Ctrl+Shift+O to start new chat
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+o}' : '{ctrl+shift+o}');

    // Welcome message should appear (message id 1 is the first/welcome message)
    chat.isReady();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    // Open history with keyboard shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+s}' : '{ctrl+shift+s}');

    history.isOpen();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('05-history-opened');

    // Close history with keyboard shortcut
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+s}' : '{ctrl+shift+s}');

    history.isClosed();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('06-history-closed');
  });

  it('Test 4: Copy Last Response (Ctrl+Shift+C)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Response to copy.' });
    chat.sendMessage('Message to copy response');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Stub clipboard API before pressing the copy shortcut (avoid permission errors in headless CI)
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+c}' : '{ctrl+shift+c}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Message before deletion.' });
    chat.sendMessage('Message before delete');

    const responseMessage = chat.getMessage(3);

    responseMessage.isCompleted();

    // Press Ctrl+Shift+Backspace to trigger delete modal
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta+shift+backspace}' : '{ctrl+shift+backspace}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('08-delete-modal');

    // Confirm deletion
    new DeleteChatPromptPo().confirm();

    chat.isReady();

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
    }

    // Wait for last response to complete
    const lastResponseIndex = 1 + messages.length * 2;
    const lastResponse = chat.getMessage(lastResponseIndex);

    lastResponse.isCompleted();

    const textarea = cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]');

    // ArrowUp — navigate to previous prompt (Third message)
    textarea.type('{uparrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('10-arrow-up');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .should('have.value', 'Third message');

    // ArrowUp again — navigate to Second message
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{uparrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('11-arrow-up-twice');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .should('have.value', 'Second message');

    // ArrowDown — navigate back to Third message
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('{downarrow}');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('12-arrow-down');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .should('have.value', 'Third message');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('13-prompt-selected');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    // Click the header ⋮ menu button (rc-dropdown-trigger with icon-actions)
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.icon-actions')
      .click();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('14-menu-opened');

    // Click "View Keyboard Shortcuts" menu item
    cy.contains('Keyboard Shortcuts').click();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('15-shortcuts-popover');
  });
});
