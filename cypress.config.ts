import { extendConfig } from '@rancher/cypress/extend-config';

export default extendConfig({
  env: {
    helmChartDir: './rancher-ai-agent',
    llmMockServiceProxyPath: '/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy',
    chatServiceProxyPath: '/api/v1/namespaces/cattle-ai-agent-system/services/http:rancher-ai-agent:80/proxy/v1/api'
  },
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    // TEMPORARY: only run the two env-check suites while validating Helm/k3s.
    // The setup spec MUST come first: it performs the first-time Rancher
    // bootstrap (set admin password, accept terms, first login). Without it
    // Rancher stays on the setup wizard and cy.login() never finds the login
    // form (`local-login-username`), so every subsequent spec fails.
    specPattern: [
      'cypress/e2e/tests/setup/**/*.spec.ts',
      'cypress/e2e/tests/features/chat.spec.ts'
    ]
  }
});