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
    cy.clearLLMResponses();
    HomePagePo.goTo();
  });

  afterEach(() => cy.cleanChatHistory());

  it('Test 1: Open / Close Chat Panel (Alt+K / ⌘+Shift+K)', () => {
    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');

    chat.isOpen();
    cy.screenshot('01-chat-opened');

    cy.get('body').type(isMac ? '{meta}{shift}k' : '{alt}k');

    chat.isClosed();
    cy.screenshot('02-chat-closed');
  });

  it('Test 2: New Chat (Ctrl+Shift+O)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    chat.getMessage(2).containsText('Hello');
    chat.getMessage(3).isCompleted();

    cy.screenshot('03-before-new-chat');

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}o' : '{ctrl}{shift}o');

    chat.isReady();
    chat.getMessage(1).isCompleted();

    cy.screenshot('04-after-new-chat');
  });

  it('Test 3: Toggle History (Ctrl+Shift+S)', () => {
    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}s' : '{ctrl}{shift}s');

    cy.wait(500);
    history.isOpen();
    cy.screenshot('05-history-opened');

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
    chat.sendMessage('Say something');

    chat.getMessage(2).containsText('Say something');
    chat.getMessage(3).isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}c' : '{ctrl}{shift}c');

    cy.wait(300);

    chat.isOpen();
    cy.screenshot('07-after-copy');
  });

  it('Test 5: Delete Chat (Ctrl+Shift+Backspace)', () => {
    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Response for delete test.' });
    chat.sendMessage('Message to delete');

    chat.getMessage(2).containsText('Message to delete');
    chat.getMessage(3).isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .type(isMac ? '{meta}{shift}{backspace}' : '{ctrl}{shift}{backspace}');

    cy.wait(300);

    new DeleteChatPromptPo().self().should('exist');
    cy.screenshot('08-delete-modal');

    new DeleteChatPromptPo().confirm();

    chat.isReady();
    chat.getMessage(1).isCompleted();
    cy.screenshot('09-after-delete');
  });

  it('Test 6: Prompt History Navigation (ArrowUp / ArrowDown / Tab)', () => {
    chat.open();
    chat.isReady();

    const messages = ['First message', 'Second message', 'Third message'];

    for (const msg of messages) {
      cy.enqueueLLMResponse({ text: `Response to: ${ msg }` });
      chat.sendMessage(msg);
    }

    chat.getMessage(7).isCompleted();

    const textarea = cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]');

    textarea.type('{uparrow}');
    cy.wait(300);
    cy.screenshot('10-arrow-up');

    textarea.type('{uparrow}');
    cy.wait(300);
    cy.screenshot('11-arrow-up-twice');

    textarea.type('{downarrow}');
    cy.wait(300);
    cy.screenshot('12-arrow-down');

    textarea.type('{tab}', { force: true });
    cy.wait(300);
    cy.screenshot('13-tab-accepted');

    textarea.invoke('val').should('not.be.empty');
  });

  it('Test 7: Shortcuts Popover', () => {
    chat.open();
    chat.isReady();

    cy.get('.chat-console-menu-container button').first().click();

    cy.wait(300);
    cy.screenshot('14-menu-opened');

    cy.contains('Keyboard Shortcuts').click({ force: true });

    cy.wait(300);

    cy.get('.v-popper__inner').should('be.visible');
    cy.screenshot('15-shortcuts-popover');
  });
});
