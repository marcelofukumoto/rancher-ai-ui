import ComponentPo from '@rancher/cypress/e2e/po/components/component.po';

export class KeyboardShortcutsPo extends ComponentPo {
  constructor() {
    super('.shortcuts');
  }

  isVisible() {
    return this.checkExists();
  }

  containsShortcut(actionText: string) {
    return this.self().contains(actionText);
  }
}
