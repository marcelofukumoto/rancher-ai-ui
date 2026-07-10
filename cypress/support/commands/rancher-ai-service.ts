import { InstallRancherAIServiceArgs } from '@/cypress/globals';
import { rancherApiUrl } from '../utils/rancher-url';

/**
 * Resolves a kubeconfig for the local cluster and yields its path.
 *
 * In the Helm-on-k3s CI topology a direct kubeconfig for the cluster is already on disk
 * (written by install-rancher.sh, path passed via the `kubeconfig` Cypress env). We use it
 * directly because (a) Rancher's `generateKubeconfig` action returns a proxied kubeconfig
 * whose `config` is empty here, and (b) helm release metadata is only visible from the same
 * (direct) kubeconfig the charts were installed with, so `helm uninstall` actually tears the
 * agent down - which the disconnection tests depend on. Falls back to `generateKubeconfig`
 * for environments that don't provide a direct kubeconfig.
 */
function resolveKubeconfig(): Cypress.Chainable<string> {
  const directKubeconfig = Cypress.env('kubeconfig');

  if (directKubeconfig) {
    return cy.wrap(directKubeconfig, { log: false });
  }

  return cy.getCookie('CSRF').then((token) => {
    return cy.request({
      method:  'POST',
      url:     rancherApiUrl('/v3/clusters/local?action=generateKubeconfig'),
      headers: {
        'x-api-csrf': token?.value,
        Accept:       'application/json'
      },
    }).then((resp) => {
      expect(resp.status).to.eq(200);

      const kubeconfig = `${ Cypress.config('downloadsFolder') }/local.yaml`;

      cy.writeFile(kubeconfig, resp.body.config);

      return kubeconfig;
    });
  });
}

/**
 * Installs Rancher AI to the local cluster.
 */
Cypress.Commands.add('installRancherAIService', ( args: InstallRancherAIServiceArgs = { waitForAIServiceReady: true }) => {
  return resolveKubeconfig().then((kubeconfig) => {
    const waitFlag = args.waitForAIServiceReady ? 'true' : 'false';
    const fetchReposFlag = 'false';

    const cmd = `.github/scripts/deploy-rancher-ai.sh ${ kubeconfig } ${ waitFlag } ${ fetchReposFlag }`;

    cy.log('Cmd to execute:', cmd, 'flags: waitForAIServiceReady =', waitFlag, ', fetchRepos =', fetchReposFlag);

    cy.exec(cmd, {
      failOnNonZeroExit: false,
      timeout:           240000
    }).then((result) => {
      if (args.waitForAIServiceReady) {
        cy.log(`Script output: ${ result.stdout || 'None' }`);
        cy.log(`Script error: ${ result.stderr || 'None' }`);

        expect(result.code).to.eq(0);
      }
    });
  });
});

/**
 * Guards against the agent-restart cascade on the Helm-on-k3s CI runner.
 *
 * The single-worker agent can be CPU-starved on the shared runner and get restarted by its k8s
 * liveness probe, which drops active chat WebSockets. Run as a between-test guard, this lets a
 * test that follows a restart wait for the agent to become Available again - instead of its
 * beforeEach (which opens the chat and waits for the welcome message) racing the restart and
 * cascade-failing. It also gives Cypress retries a healthy agent to retry against. Bounded and
 * non-fatal: each test's own assertions still govern correctness.
 *
 * Only active when a direct kubeconfig is provided (the Helm-on-k3s topology). Elsewhere it is a
 * no-op, so local / yarn-dev runs against a shared cluster don't shell out on every test.
 */
Cypress.Commands.add('waitForAiAgentReady', () => {
  const kubeconfig = Cypress.env('kubeconfig');

  if (!kubeconfig) {
    return;
  }

  const cmd = `KUBECONFIG='${ kubeconfig }' kubectl -n cattle-ai-agent-system rollout status deployment/rancher-ai-agent --timeout=120s`;

  cy.exec(cmd, {
    failOnNonZeroExit: false,
    timeout:           130000
  }).then((result) => {
    if (result.code !== 0) {
      cy.log(`waitForAiAgentReady: agent not Available within timeout - ${ result.stderr || result.stdout || 'unknown' }`);
    }
  });
});

/**
 * Uninstalls Rancher AI from the local cluster.
 */
Cypress.Commands.add('uninstallRancherAIService', () => {
  return resolveKubeconfig().then((kubeconfig) => {
    const cmd = `.github/scripts/uninstall-rancher-ai.sh ${ kubeconfig }`;

    cy.exec(cmd, {
      failOnNonZeroExit: false,
      timeout:           240000
    }).then((result) => {
      cy.log(`Script output: ${ result.stdout || 'None' }`);
      cy.log(`Script error: ${ result.stderr || 'None' }`);

      expect(result.code).to.eq(0);
    });

    // Wait some time for the uninstalled schemas to be removed from Rancher
    cy.wait(2000);
  });
});
