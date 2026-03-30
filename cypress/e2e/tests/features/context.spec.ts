import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ClusterDashboardPagePo from '@rancher/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { WorkloadsDeploymentsListPagePo } from '@rancher/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import ChatPo from '@/cypress/e2e/po/chat.po';

describe('Feature: context', () => {
  const chat = new ChatPo();

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Test 1: Shows cluster context tag on cluster page', () => {
    const clusterPage = new ClusterDashboardPagePo('local');

    clusterPage.goTo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-1-cluster-context-tag-visible');
  });

  it('Test 2: Shows no context on home page', () => {
    HomePagePo.goTo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-chat-container"]').within(() => {
      cy.get('[data-testid^="rancher-ai-ui-context-tag-"]').should('not.exist');
      cy.get('.chat-context .no-context').should('be.visible');
    });

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-2-no-context-home-page');
  });

  it('Test 3: Removes a context tag via deselect button', () => {
    const clusterPage = new ClusterDashboardPagePo('local');

    clusterPage.goTo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('exist');

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]')
      .parent()
      .find('.vs__deselect')
      .click();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('not.exist');
    cy.get('.context-reset').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-3-context-tag-removed');
  });

  it('Test 4: Resets context to restore all tags', () => {
    const clusterPage = new ClusterDashboardPagePo('local');

    clusterPage.goTo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]')
      .parent()
      .find('.vs__deselect')
      .click();

    cy.get('.context-reset').should('be.visible');

    cy.get('.context-reset button').click();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('exist');
    cy.get('.context-reset').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-4-context-reset');
  });

  it('Test 5: Adds a context item via dropdown re-adds the tag', () => {
    const clusterPage = new ClusterDashboardPagePo('local');

    clusterPage.goTo();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]')
      .parent()
      .find('.vs__deselect')
      .click();

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('not.exist');

    cy.get('.context-trigger').click();

    cy.contains('.context-dropdown [role="option"], [class*="rc-dropdown-item"]', 'cluster').click({ force: true });

    cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-5-context-added-via-dropdown');
  });

  it('Test 6: Context tag is included in the sent message\'s metadata', () => {
    const clusterPage = new ClusterDashboardPagePo('local');

    clusterPage.goTo();

    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: 'Context received.' });

    chat.sendMessage('What is the cluster context?');

    const userMessage = chat.getMessage(2);

    userMessage.containsText('What is the cluster context?');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();
    aiMessage.context('local').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-6-context-in-message');

    cy.cleanChatHistory();
  });

  it('Test 7: Context panel is disabled when chat is in processing state', () => {
    const clusterPage = new ClusterDashboardPagePo('local');

    clusterPage.goTo();

    chat.open();
    chat.isReady();

    cy.enqueueLLMResponse({ text: ['Processing...', ' done.'], chunkSize: 1 });

    chat.sendMessage('Trigger processing');

    cy.get('.chat-context.disabled-panel').should('exist');
    cy.get('.context-trigger[disabled]').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-7-context-disabled-during-processing');

    cy.cleanChatHistory();
  });

  it('Test 8: Shows namespace context when namespace filter is active', () => {
    const deploymentsPage = new WorkloadsDeploymentsListPagePo('local', 'apps.deployment' as any);

    deploymentsPage.goTo();
    deploymentsPage.waitForPage();

    chat.open();
    chat.isReady();

    cy.get('[data-testid="rancher-ai-ui-context-tag-default"]').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('context-test-8-namespace-context-tag');
  });
});
