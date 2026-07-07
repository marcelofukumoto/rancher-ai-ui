import { extendConfig } from '@rancher/cypress/extend-config';

export default extendConfig({
  // The extension catalog server (serve-pkgs) is plain http on :8080 while the dashboard is
  // https; disabling web security lets the developer-loaded extension script load.
  chromeWebSecurity: false,
  env:               {
    helmChartDir: './rancher-ai-agent',
    llmMockServiceProxyPath: '/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy',
    chatServiceProxyPath: '/api/v1/namespaces/cattle-ai-agent-system/services/http:rancher-ai-agent:80/proxy/v1/api'
  },
  e2e: {
    supportFile: 'cypress/support/e2e.ts',
    // TEMPORARY: while validating the serve-pkgs / developer-load setup, run only chat.spec.ts.
    // Rancher is bootstrapped via API (install-rancher.sh), so the first-login setup spec is skipped.
    // Remove before opening the PR.
    specPattern: ['cypress/e2e/tests/features/chat.spec.ts']
  }
});
