import '@rancher/cypress/support/e2e';
import 'cypress-real-events';
import './commands/rancher-api';
import './commands/rancher-ai-service';
import './commands/llm-mock-service-api';
import './commands/chat-history';
import './commands/multi-agent';
import './commands/ui-tools';

// The AI Assistant extension is prime-only: when developer-loaded (i.e. not a built-in
// extension) into a community Rancher it gates itself off with a "requires Rancher Prime"
// notice and never registers the chat. `yarn dev` sidesteps this because the extension is
// built in there (isDev). For the developer-load / same-origin setup we fake the Prime flag
// on /rancherversion (exactly what the `yarn dev` PRIME proxy does) so the extension activates.
beforeEach(() => {
  cy.intercept({
    method: 'GET',
    url:    '**/rancherversion'
  }, (req) => {
    req.continue((res) => {
      let body = res.body;

      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return;
        }
      }

      if (body && typeof body === 'object') {
        body.RancherPrime = 'true';
        res.body = body;
      }
    });
  });
});
