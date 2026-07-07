import ExtensionsPagePo from '@rancher/cypress/e2e/po/pages/extensions.po';
import DeveloperLoadDialogPo from '@/cypress/e2e/po/pages/extensions/developer-load.po';

const CLUSTER_ID = 'local';

/**
 * Developer-load the rancher-ai-ui extension into the stock Rancher dashboard from the
 * local extension catalog server (serve-pkgs). Mirrors rancher/dashboard's Extension
 * Compatibility test. Persists a UIPlugin CR so subsequent page loads pick it up.
 */
Cypress.Commands.add('developerLoadExtension', () => {
  const serverUrl = Cypress.env('extension_server_url') || 'http://127.0.0.1:8080';

  cy.login();

  // Discover the extension (name/version/main) from the serve-pkgs catalog.
  cy.request(`${ serverUrl }/`).then((resp) => {
    const ext = (resp.body || [])[0];

    if (!ext) {
      throw new Error(`No extension found in the catalog at ${ serverUrl }`);
    }

    const moduleName = `${ ext.name }-${ ext.version }`;
    const extensionUrl = `${ serverUrl }/${ moduleName }/${ ext.main }`;

    // Enable developer features so the "Developer Load" action is available.
    cy.setUserPreference({ 'plugin-developer': true });

    // Warm up the local cluster route (side-nav renders once the cluster is ready).
    cy.visit(`/c/${ CLUSTER_ID }/explorer`);
    cy.get('.side-nav', { timeout: 120000 }).should('be.visible');

    const extensionsPo = new ExtensionsPagePo();

    ExtensionsPagePo.goTo();
    cy.get('[data-testid="extensions-page-title"]', { timeout: 120000 }).should('contain', 'Extensions');

    extensionsPo.extensionMenuToggle();
    cy.contains('Developer Load', { timeout: 30000 }).should('be.visible').click();

    new DeveloperLoadDialogPo().fillAndLoad(extensionUrl, moduleName, true);

    // Click the reload banner if it appears (loads the freshly-registered extension).
    cy.get('body', { timeout: 60000 }).then(($body) => {
      const btn = $body.find('[data-testid="extension-reload-banner-reload-btn"]');

      if (btn.length) {
        cy.wrap(btn).click();
      }
    });

    // Ensure the extension is active: the AI header action button should render.
    cy.visit('/home');
    cy.get('[data-testid="extension-header-action-ai.action.openChat"]', { timeout: 120000 }).should('exist');
  });
});
