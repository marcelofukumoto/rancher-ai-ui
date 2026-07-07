/**
 * Create agent config in the cluster
 *
 * @return void
 */
Cypress.Commands.add('createAgentConfig', (config: object) => {
  cy.createRancherResource('v1', 'ai.cattle.io.aiagentconfig', JSON.stringify(config), false);
});

/**
 * Update agent config in the cluster
 *
 * @return void
 */
Cypress.Commands.add('updateAgentConfig', (config: object) => {
  const { name, namespace } = (config as any).metadata;
  const updatedSpec = (config as any).spec;

  cy.getRancherResource('v1', 'ai.cattle.io.aiagentconfig', `${ namespace }/${ name }`).then((resp) => {
    const updatedConfig = {
      metadata: { ...resp.body.metadata },
      spec:     {
        ...resp.body.spec,
        ...updatedSpec
      }
    };

    cy.setRancherResource('v1', 'ai.cattle.io.aiagentconfig', `${ namespace }/${ name }`, updatedConfig).then((putResp: any) => {
      // DIAGNOSTIC (temporary): record what the PUT sent vs what Steve echoed back.
      cy.writeFile(`cypress/logs/test3-put-${ name }.json`, JSON.stringify({
        name, sentEnabled: updatedConfig.spec?.enabled, respStatus: putResp?.status, respEnabled: putResp?.body?.spec?.enabled
      }, null, 2), { log: false });
    });
  });
});

/**
 * Delete agent config from the cluster
 *
 * @return void
 */
Cypress.Commands.add('deleteAgentConfig', (config: object) => {
  const { name, namespace } = (config as any).metadata;

  cy.deleteRancherResource('v1', 'ai.cattle.io.aiagentconfig', `${ namespace }/${ name }`, false);
});
