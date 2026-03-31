import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { ConsolePo } from '@/cypress/e2e/po/console.po';

describe('Console', () => {
  const chat = new ChatPo();
  const console = new ConsolePo();

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });

  afterEach(() => cy.cleanChatHistory());

  it('sends a message via Enter key', () => {
    chat.open();
    chat.isReady();

    chat.getMessage(1).isCompleted();

    cy.enqueueLLMResponse({ text: 'Mock response to Enter send.', chunkSize: 30 });

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .type('Hello from Enter key')
      .type('{enter}');

    chat.getMessage(2).containsText('Hello from Enter key');
    chat.getMessage(3).isCompleted();
    chat.getMessage(3).containsText('Mock response to Enter send.');
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('have.value', '');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-1-send-via-enter');
  });

  it('adds a newline with Shift+Enter without sending', () => {
    chat.open();
    chat.isReady();

    chat.getMessage(1).isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .type('First line{shift}{enter}Second line');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('contain.value', 'First line');
    cy.get('[data-testid="rancher-ai-ui-chat-message-box-2"]').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-2-shift-enter-newline');
  });

  it('sends a message via the send button', () => {
    chat.open();
    chat.isReady();

    chat.getMessage(1).isCompleted();

    console.sendButton().should('be.disabled');

    cy.enqueueLLMResponse({ text: 'Mock response to button send.', chunkSize: 30 });

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('Hello from button');

    console.sendButton().should('not.be.disabled');
    console.sendButton().click();

    chat.getMessage(2).containsText('Hello from button');
    chat.getMessage(3).isCompleted();
    chat.getMessage(3).containsText('Mock response to button send.');
    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('have.value', '');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-3-send-via-button');
  });

  it('disables send button when textarea is empty', () => {
    chat.open();
    chat.isReady();

    console.sendButton().should('be.disabled');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('a');
    console.sendButton().should('not.be.disabled');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').clear();
    console.sendButton().should('be.disabled');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-4-send-button-state');
  });

  it('disables textarea while AI is processing', () => {
    chat.open();
    chat.isReady();

    chat.getMessage(1).isCompleted();

    cy.enqueueLLMResponse({
      text:      'This is a very long AI response that will be streamed one character at a time to ensure the console is still in the disabled state while we test for it.',
      chunkSize: 1,
    });

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .type('Test disabled state')
      .type('{enter}');

    cy.get(`[data-teststatus="rancher-ai-ui-chat-message-status-3-inprogress"]`).should('exist');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('not.have.attr', 'disabled');
    console.sendButton().should('be.disabled');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-5-disabled-during-processing');
  });

  it('navigates prompt history with up and down arrows', () => {
    chat.open();
    chat.isReady();

    chat.getMessage(1).isCompleted();

    cy.enqueueLLMResponse({ text: 'Response 1', chunkSize: 30 });
    chat.sendMessage('First history message');
    chat.getMessage(3).isCompleted();

    cy.enqueueLLMResponse({ text: 'Response 2', chunkSize: 30 });
    chat.sendMessage('Second history message');
    chat.getMessage(5).isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('have.value', '');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .trigger('keydown', {
        key:     'ArrowUp',
        keyCode: 38,
        which:   38,
        code:    'ArrowUp',
      });
    cy.wait(100);
    cy.get('.chat-input-complete .text').should('contain.text', 'Second history message');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .trigger('keydown', {
        key:     'ArrowUp',
        keyCode: 38,
        which:   38,
        code:    'ArrowUp',
      });
    cy.wait(100);
    cy.get('.chat-input-complete .text').should('contain.text', 'First history message');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .trigger('keydown', {
        key:     'ArrowDown',
        keyCode: 40,
        which:   40,
        code:    'ArrowDown',
      });
    cy.wait(100);
    cy.get('.chat-input-complete .text').should('contain.text', 'Second history message');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .trigger('keydown', {
        key:     'ArrowDown',
        keyCode: 40,
        which:   40,
        code:    'ArrowDown',
      });
    cy.wait(100);
    cy.get('.chat-input-complete').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-6-prompt-history-navigation');
  });

  it('accepts recalled text with Tab key', () => {
    chat.open();
    chat.isReady();

    chat.getMessage(1).isCompleted();

    cy.enqueueLLMResponse({ text: 'Tab test response', chunkSize: 30 });
    chat.sendMessage('Tab test message');
    chat.getMessage(3).isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('have.value', '');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .trigger('keydown', {
        key:     'ArrowUp',
        keyCode: 38,
        which:   38,
        code:    'ArrowUp',
      });
    cy.wait(100);
    cy.get('.chat-input-complete .text').should('contain.text', 'Tab test message');

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]')
      .trigger('keydown', {
        key:     'Tab',
        keyCode: 9,
        which:   9,
        code:    'Tab',
      });
    cy.wait(100);

    cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('contain.value', 'Tab test message');
    cy.get('.chat-input-complete').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-7-tab-autocomplete');
  });

  it('shows the LLM model label in the console footer', () => {
    chat.open();
    chat.isReady();

    console.llmModelLabel().should('exist').and('be.visible');
    console.llmModelLabel().invoke('text').should('not.be.empty');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-8-llm-model-label');
  });

  it('opens the verify results disclaimer popover', () => {
    chat.open();
    chat.isReady();

    console.disclaimerButton().click();

    console.disclaimerPopover().should('exist').and('be.visible');
    cy.get('.disclaimer-section-title').should('have.length.at.least', 1);

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-9-disclaimer-popover');
  });
});
