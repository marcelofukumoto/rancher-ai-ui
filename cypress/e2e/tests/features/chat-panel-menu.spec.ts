import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { ChatPanelMenuPo } from '@/cypress/e2e/po/chat-panel-menu.po';

describe('Feature: chat-panel-menu', () => {
  const chat = new ChatPo();
  const menu = new ChatPanelMenuPo();

  before(() => cy.login());

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    chat.open();
    chat.isReady();
  });

  afterEach(() => cy.cleanChatHistory());

  it('Test 1: Menu button is visible in chat header', () => {
    cy.get('[data-testid="rancher-ai-ui-chat-container"]')
      .find('.chat-console-menu-container')
      .should('be.visible');

    menu.menuButton().should('be.visible').and('not.be.disabled');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-1-menu-button-visible');
  });

  it('Test 2: Clicking the menu button opens the dropdown', () => {
    menu.open();

    cy.get('.v-popper__inner').should('be.visible');
    cy.contains('Download Messages').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-2-dropdown-open');
  });

  it('Test 3: Dropdown shows all three expected options', () => {
    menu.open();

    cy.contains('Download Messages').should('be.visible');
    cy.contains('View Keyboard Shortcuts').should('be.visible');
    cy.contains('Edit Configuration').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-3-all-options-visible');
  });

  it('Test 4: Download Messages triggers a file download', () => {
    cy.enqueueLLMResponse({ text: 'Hello from AI.' });
    chat.sendMessage('Hello');

    cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').should('exist');

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').as('createObjectURL');
    });

    menu.open();
    cy.contains('Download Messages').click();

    cy.get('@createObjectURL').should('have.been.calledAtLeastOnce');
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-4-download-triggered');
  });

  it('Test 5: View Keyboard Shortcuts opens the shortcuts overlay', () => {
    menu.open();
    cy.contains('View Keyboard Shortcuts').click();

    cy.get('.shortcuts-title').should('be.visible').and('contain', 'Keyboard Shortcuts');
    cy.get('.shortcuts').should('be.visible');
    cy.get('.shortcuts-row').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-5-shortcuts-overlay-open');
  });

  it('Test 6: Shortcuts overlay displays all expected keyboard shortcut entries', () => {
    menu.open();
    cy.contains('View Keyboard Shortcuts').click();

    cy.get('.shortcuts-row').should('have.length.at.least', 6);
    cy.contains('.shortcuts-action', 'Open / Close Chat Panel').should('exist');
    cy.contains('.shortcuts-action', 'New Chat').should('exist');
    cy.contains('.shortcuts-action', 'Copy Last Response').should('exist');
    cy.contains('.shortcuts-action', 'View Previous Chats').should('exist');
    cy.contains('.shortcuts-action', 'Delete Current Chat').should('exist');
    cy.contains('.shortcuts-action', 'Previous / Next Prompt').should('exist');
    cy.get('.shortcuts-key').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-6-shortcuts-all-entries');
  });

  it('Test 7: Edit Configuration navigates to the settings page', () => {
    HomePagePo.goTo();
    chat.open();
    chat.isReady();

    menu.open();
    cy.contains('Edit Configuration').click();

    cy.url({ timeout: 10000 }).should('contain', 'settings');
    cy.contains('AI Assistant Configuration').should('be.visible');

    cy.wait(500);
    cy.screenshot('chat-panel-menu-test-7-navigate-to-settings');
  });

  it('Test 8: Dropdown closes after selecting an option', () => {
    menu.open();
    cy.contains('View Keyboard Shortcuts').should('be.visible');
    cy.contains('View Keyboard Shortcuts').click();

    cy.contains('Download Messages').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-8-dropdown-closes-after-action');
  });

  it('Test 9: Dropdown closes when clicking outside', () => {
    menu.open();
    cy.contains('Download Messages').should('be.visible');

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').click(10, 200);

    cy.contains('Download Messages').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('chat-panel-menu-test-9-dropdown-closes-on-outside-click');
  });
});
