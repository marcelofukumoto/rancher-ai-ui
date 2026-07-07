// Page object for the shell's "Developer Load" extension dialog
// (@rancher/shell/dialog/DeveloperLoadExtensionDialog.vue).
export default class DeveloperLoadDialogPo {
  private self() {
    return cy.get('.plugin-install-dialog', { timeout: 30000 });
  }

  urlInput() {
    return this.self().find('.labeled-input').first().find('input');
  }

  nameInput() {
    return this.self().find('.labeled-input').eq(1).find('input');
  }

  persistCheckbox() {
    return this.self().find('[data-checkbox-ctrl]');
  }

  loadButton() {
    return this.self().find('[data-testid="dev-install-ext-modal-install-btn"]');
  }

  fillAndLoad(url: string, moduleName: string, persist = true) {
    this.urlInput().clear().type(url);
    this.nameInput().clear().type(moduleName);

    if (persist) {
      this.persistCheckbox().click();
    }

    this.loadButton().click();
  }
}
