import ComponentPo from '@rancher/cypress/e2e/po/components/component.po';

export class ChatPanelMenuPo extends ComponentPo {
  constructor() {
    super('.chat-console-menu-container');
  }

  menuButton() {
    return this.self().find('button');
  }

  open() {
    this.menuButton().click();

    return this;
  }

  downloadOption() {
    return cy.contains('Download Messages');
  }

  shortcutsOption() {
    return cy.contains('View Keyboard Shortcuts');
  }

  configOption() {
    return cy.contains('Edit Configuration');
  }

  isDropdownOpen() {
    return cy.contains('Download Messages').should('be.visible');
  }

  isDropdownClosed() {
    return cy.contains('Download Messages').should('not.exist');
  }
}
