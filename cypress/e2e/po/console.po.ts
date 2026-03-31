import ComponentPo from '@rancher/cypress/e2e/po/components/component.po';

class AgentItemPo extends ComponentPo {
  constructor(name: string) {
    super(`[data-testid="rancher-ai-ui-multi-agent-select-option-${ name }"]`);
  }

  select() {
    this.self().click();
  }

  checkSelected() {
    this.self().find('.icon-checkmark').should('exist');
  }

  checkNotSelected() {
    this.self().find('.icon-checkmark').should('not.exist');
  }
}

class SelectAgentPo extends ComponentPo {
  constructor() {
    super('[data-testid="rancher-ai-ui-multi-agent-select"]');
  }

  open() {
    this.self().click();
  }

  agentItem(name: string) {
    return new AgentItemPo(name);
  }
}

export class ConsolePo extends ComponentPo {
  constructor() {
    super('[data-testid="rancher-ai-ui-chat-console"]');
  }

  textarea() {
    return this.self().get('textarea[data-testid="rancher-ai-ui-chat-input-textarea"]');
  }

  sendButton() {
    return this.self().find('.send-button');
  }

  recalledTextOverlay() {
    return cy.get('.chat-input-complete .text');
  }

  llmModelLabel() {
    return cy.get('.llm-model-label');
  }

  disclaimerButton() {
    return cy.get('.textlabel-popper .inline-button').first();
  }

  disclaimerPopover() {
    return cy.get('.disclaimer');
  }

  selectAgent() {
    return new SelectAgentPo();
  }

  sendMessage(value: string) {
    this.textarea().type(value).type('{enter}');
  }
}