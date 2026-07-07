const UI_PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

/**
 * Developer-load the rancher-ai-ui extension into the stock Rancher dashboard by creating a
 * UIPlugin CR that points at the local extension catalog server (serve-pkgs). Rancher's built-in
 * UIPlugin controller then serves it and the dashboard loads it directly (direct dev load).
 * Mirrors rancher/dashboard's Extension Compatibility test, but via the API (no UI dialog / user
 * preference, which is unavailable on a freshly API-bootstrapped admin).
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
    const endpoint = `${ serverUrl }/${ moduleName }/${ ext.main }`;

    const uiPlugin = {
      apiVersion: 'catalog.cattle.io/v1',
      kind:       'UIPlugin',
      metadata:   {
        name:      moduleName,
        namespace: UI_PLUGIN_NAMESPACE,
      },
      spec: {
        plugin: {
          name:     `${ ext.name }-developer-load`,
          version:  ext.version,
          endpoint,
          noCache:  true,
          metadata: {
            direct:                                    'true',
            'catalog.cattle.io/ui-extensions-version': '>= 3',
          },
        },
      },
    };

    // failOnStatusCode: false so a re-run (409 already exists) is harmless.
    cy.createRancherResource('v1', 'catalog.cattle.io.uiplugin', JSON.stringify(uiPlugin), false);

    // Load the dashboard; the freshly-registered extension should be picked up and its
    // AI header action should render.
    cy.visit('/home');
    cy.get('[data-testid="extension-header-action-ai.action.openChat"]', { timeout: 120000 }).should('exist');
  });
});
