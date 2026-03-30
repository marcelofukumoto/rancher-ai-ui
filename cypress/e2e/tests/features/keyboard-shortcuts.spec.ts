import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { ConsolePo } from '@/cypress/e2e/po/console.po';
import { HistoryPo } from '@/cypress/e2e/po/history.po';
import DeleteChatPromptPo from '@/cypress/e2e/po/dialog/delete-chat.po';
import { KeyboardShortcutsPo } from '@/cypress/e2e/po/keyboard-shortcuts.po';

describe('Feature: keyboard-shortcuts', () => {
  const chat = new ChatPo();
  const isMac = Cypress.platform === 'darwin';

  before(() => {
    cy.cleanChatHistory();
  });

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });

  afterEach(() => {
    cy.clearLLMResponses();
  });

  it('Test 1: Open and close chat panel via Alt+K global shortcut', () => {
    chat.isClosed();

    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');

    chat.isOpen();
    chat.isReady();

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-1-open-close-chat');

    cy.get('body').type(isMac ? '{meta+shift+k}' : '{alt+k}');

    chat.isClosed();
  });

  it('Test 2: Open a new chat session via Ctrl+Shift+O', () => {
    chat.open();
    chat.isReady();

    const welcomeMsg = chat.getMessage(1);

    welcomeMsg.isCompleted();

    cy.enqueueLLMResponse({ text: 'New chat response' });
    chat.sendMessage('Hello from the test');

    const aiResponse = chat.getMessage(3);

    aiResponse.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+o}');

    const newWelcomeMsg = chat.getMessage(1);

    newWelcomeMsg.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-message-box-2"]').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-2-new-chat');
  });

  it('Test 3: Toggle history panel via Ctrl+Shift+S', () => {
    const history = new HistoryPo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-chat-history-panel"]').should('not.exist');

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+s}');
    cy.wait(500);

    cy.get('[data-testid="rancher-ai-ui-chat-history-panel"]').should('exist');

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+s}');
    cy.wait(500);

    cy.get('[data-testid="rancher-ai-ui-chat-history-panel"]').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-3-toggle-history');
  });

  it('Test 4: Delete current chat via Ctrl+Shift+Backspace', () => {
    chat.open();
    chat.isReady();

    const welcomeMsg = chat.getMessage(1);

    welcomeMsg.isCompleted();

    cy.enqueueLLMResponse({ text: 'Response before delete' });
    chat.sendMessage('Message to delete');

    const aiResponse = chat.getMessage(3);

    aiResponse.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+backspace}');

    const deletePrompt = new DeleteChatPromptPo();

    cy.get('[data-testid="card"].prompt-remove').should('be.visible');

    deletePrompt.confirm();

    const newWelcomeMsg = chat.getMessage(1);

    newWelcomeMsg.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-message-box-2"]').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-4-delete-chat');
  });

  it('Test 5: Copy last AI response via Ctrl+Shift+C', () => {
    chat.open();
    chat.isReady();

    const welcomeMsg = chat.getMessage(1);

    welcomeMsg.isCompleted();

    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWrite');
    });

    cy.enqueueLLMResponse({ text: 'Unique clipboard content from the AI' });
    chat.sendMessage('Copy this response');

    const aiResponse = chat.getMessage(3);

    aiResponse.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+c}');

    cy.get('@clipboardWrite').should('have.been.calledWith', 'Unique clipboard content from the AI');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-5-copy-last-message');
  });

  it('Test 6: Open keyboard shortcuts reference from chat header menu', () => {
    const shortcuts = new KeyboardShortcutsPo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.icon-actions')
      .click();

    cy.get('.rc-dropdown-item').should('be.visible');

    cy.get('.rc-dropdown-item').contains(/keyboard shortcut/i).click();

    shortcuts.isVisible();
    shortcuts.containsShortcut('Open / Close');
    shortcuts.containsShortcut('New Chat');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-6-shortcuts-popover');
  });

  it('Test 7: Keyboard shortcuts are disabled for a new empty chat', () => {
    chat.open();
    chat.isReady();

    const welcomeMsg = chat.getMessage(1);

    welcomeMsg.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+o}');

    cy.get('[data-testid="rancher-ai-ui-chat-message-box-1"]').should('exist');
    cy.get('[data-testid="rancher-ai-ui-chat-message-box-2"]').should('not.exist');

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').type('{ctrl+shift+backspace}');

    cy.get('[data-testid="card"].prompt-remove').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-7-shortcuts-disabled');
  });

  it('Test 8: Navigate prompt history with ArrowUp/ArrowDown in textarea', () => {
    const console = new ConsolePo();

    chat.open();
    chat.isReady();

    const welcomeMsg = chat.getMessage(1);

    welcomeMsg.isCompleted();

    cy.enqueueLLMResponse({ text: 'First response' });
    chat.sendMessage('First message');
    chat.getMessage(3).isCompleted();

    cy.enqueueLLMResponse({ text: 'Second response' });
    chat.sendMessage('Second message');
    chat.getMessage(5).isCompleted();

    console.textarea().click();
    console.textarea().should('have.value', '');

    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'Second message');

    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'First message');

    console.textarea().type('{downarrow}');
    console.textarea().should('have.value', 'Second message');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('keyboard-shortcuts-test-8-prompt-history-navigation');
  });
});
