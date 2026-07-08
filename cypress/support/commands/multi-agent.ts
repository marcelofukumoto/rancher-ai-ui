import { rancherApiUrl } from '../utils/rancher-url';

/**
 * GETs an AIAgentConfig, retrying while it is briefly absent. The AIAgentConfig CRD/schema is
 * removed and re-added when the AI service is (re)installed, so a request right after a reinstall
 * can transiently 404/5xx until Steve re-registers the type.
 */
function getAgentConfig(namespace: string, name: string, attempts = 15): Cypress.Chainable<any> {
  return cy.getCookie('CSRF').then((token) => {
    return cy.request({
      method:           'GET',
      url:              rancherApiUrl(`/v1/ai.cattle.io.aiagentconfig/${ namespace }/${ name }`),
      headers:          {
        'x-api-csrf': token?.value,
        Accept:       'application/json'
      },
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 200) {
        return resp;
      }

      if (attempts <= 1) {
        expect(resp.status, `GET aiagentconfig ${ namespace }/${ name }`).to.eq(200);

        return resp;
      }

      cy.wait(1000);

      return getAgentConfig(namespace, name, attempts - 1);
    });
  });
}

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

  getAgentConfig(namespace, name).then((resp) => {
    const updatedConfig = {
      metadata: { ...resp.body.metadata },
      spec:     {
        ...resp.body.spec,
        ...updatedSpec
      }
    };

    cy.setRancherResource('v1', 'ai.cattle.io.aiagentconfig', `${ namespace }/${ name }`, updatedConfig);
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
