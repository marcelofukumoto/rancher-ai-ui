import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { ConsolePo } from '@/cypress/e2e/po/console.po';

describe('Feature: console', () => {
  const chat = new ChatPo();
  const console = new ConsolePo();

  before(() => {
    cy.login();
    cy.cleanChatHistory();
  });

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    chat.open();
    chat.isReady();
  });

  afterEach(() => {
    cy.cleanChatHistory();
  });

  it('Test 1: Prompt history — up arrow recalls last user message', () => {
    cy.enqueueLLMResponse({ text: 'Response to history test.' });
    chat.sendMessage('Hello from history test');

    const aiMessage = chat.getMessage(2);

    aiMessage.isCompleted();

    console.textarea().should('have.value', '');
    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'Hello from history test');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-1-prompt-history-up-arrow');
  });

  it('Test 2: Prompt history — down arrow clears the recalled message', () => {
    cy.enqueueLLMResponse({ text: 'Response.' });
    chat.sendMessage('First message');

    const aiMessage = chat.getMessage(2);

    aiMessage.isCompleted();

    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'First message');
    console.textarea().type('{downarrow}');
    console.textarea().should('have.value', '');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-2-prompt-history-down-arrow');
  });

  it('Test 3: Prompt history — navigates multiple previous messages in order', () => {
    cy.enqueueLLMResponse({ text: 'Response A.' });
    chat.sendMessage('Message A');
    chat.getMessage(2).isCompleted();

    cy.enqueueLLMResponse({ text: 'Response B.' });
    chat.sendMessage('Message B');
    chat.getMessage(4).isCompleted();

    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'Message B');
    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'Message A');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-3-prompt-history-multiple-messages');
  });

  it('Test 4: Tab autocomplete fills textarea with prompt suggestion', () => {
    cy.enqueueLLMResponse({ text: 'Response.' });
    chat.sendMessage('Tab autocomplete test message');
    chat.getMessage(2).isCompleted();

    console.textarea().type('{uparrow}');
    console.textarea().should('have.value', 'Tab autocomplete test message');
    console.textarea().type('{tab}', { force: true });
    console.textarea().should('have.value', 'Tab autocomplete test message');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-4-tab-autocomplete');
  });

  it('Test 5: Enter key sends a message; Shift+Enter adds a newline', () => {
    const welcomeMessage = chat.getMessage(1);

    welcomeMessage.isCompleted();

    cy.enqueueLLMResponse({ text: 'Response to send-on-enter test.' });
    console.textarea().type('Send on Enter').type('{enter}');

    const userMessage = chat.getMessage(2);

    userMessage.containsText('Send on Enter');

    console.textarea().type('Line 1').type('{shift}{enter}').type('Line 2');
    console.textarea().should('contain.value', 'Line 1\nLine 2');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-5-enter-send-vs-newline');
  });

  it('Test 6: Console is disabled while AI is processing', () => {
    const welcomeMessage = chat.getMessage(1);

    welcomeMessage.isCompleted();

    cy.enqueueLLMResponse({ text: 'A long response to slow down delivery so we can assert the disabled state before completion', chunkSize: 1 });
    console.textarea().type('Trigger processing').type('{enter}');

    console.textarea().should('have.attr', 'disabled');

    chat.getMessage(2).isCompleted();
    console.textarea().should('not.have.attr', 'disabled');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-6-disabled-while-processing');
  });

  it('Test 7: LLM model label is visible in the console footer', () => {
    cy.get('[data-testid="rancher-ai-ui-chat-console"]').should('be.visible');
    cy.get('[data-testid="rancher-ai-ui-chat-console"]').find('.llm-model-label').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-7-llm-model-label');
  });

  it('Test 8: "Verify results" disclaimer popover opens on click', () => {
    const welcomeMessage = chat.getMessage(1);

    welcomeMessage.isCompleted();

    cy.get('[data-testid="rancher-ai-ui-chat-console"]')
      .find('.textlabel-popper .inline-button')
      .click();

    cy.get('.v-popper__inner').should('be.visible');
    cy.get('.v-popper__inner').find('.disclaimer').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('console-test-8-verify-results-disclaimer');
  });
});
