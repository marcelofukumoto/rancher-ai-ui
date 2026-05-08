import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { HistoryPo } from '@/cypress/e2e/po/history.po';

describe('Feature: message-resource-actions', () => {
  const chat = new ChatPo();

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    chat.open();
    chat.isReady();

    const welcomeMessage = chat.getMessage(1);

    welcomeMessage.isCompleted();
  });

  afterEach(() => {
    cy.cleanChatHistory();
  });

  it('Test 1: getKubernetesResource generates a single resource action button', () => {
    cy.enqueueLLMResponse({
      text: 'Here is the deployment you requested.',
      tool: {
        name: 'getKubernetesResource',
        args: {
          name:      'rancher-ai-agent',
          kind:      'Deployment',
          cluster:   'local',
          namespace: 'cattle-ai-agent-system',
        },
      },
    });

    chat.sendMessage('Show me the rancher-ai-agent deployment');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.resourceButton('rancher-ai-agent').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-1-single-button');
  });

  it('Test 2: listKubernetesResources generates multiple resource action buttons', () => {
    cy.enqueueLLMResponse({
      text: 'Here are the deployments in the namespace.',
      tool: {
        name: 'listKubernetesResources',
        args: {
          kind:      'Deployment',
          cluster:   'local',
          namespace: 'cattle-ai-agent-system',
        },
      },
    });

    chat.sendMessage('List all deployments in cattle-ai-agent-system');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.self().find('[data-testid^="rancher-ai-ui-chat-message-action-button-"]').should('exist');
    aiMessage.self().find('.chat-msg-action-tags').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-2-multiple-buttons');
  });

  it('Test 3: Resource action button navigates to the resource detail page', () => {
    cy.enqueueLLMResponse({
      text: 'Here is the deployment you requested.',
      tool: {
        name: 'getKubernetesResource',
        args: {
          name:      'rancher-ai-agent',
          kind:      'Deployment',
          cluster:   'local',
          namespace: 'cattle-ai-agent-system',
        },
      },
    });

    chat.sendMessage('Navigate to rancher-ai-agent deployment');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.resourceButton('rancher-ai-agent').click();

    cy.url().should('include', '/c/local/explorer/apps.deployment/').and('include', 'rancher-ai-agent');
    cy.contains('rancher-ai-agent').should('be.visible');

    cy.wait(500);
    cy.screenshot('message-resource-actions-test-3-navigation');
  });

  it('Test 4: Resource action button is disabled for unknown resources', () => {
    cy.enqueueLLMResponse({
      text: [
        'Here is the resource you requested.',
        `<mcp-response>${JSON.stringify([{
          kind:      'Deployment',
          type:      'apps.deployment',
          name:      'nonexistent-resource-xyz',
          cluster:   'local',
          namespace: 'default',
        }])}</mcp-response>`,
      ],
    });

    chat.sendMessage('Show me nonexistent-resource-xyz');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.resourceButton('nonexistent-resource-xyz').should('exist');
    aiMessage.resourceButton('nonexistent-resource-xyz').find('button').should('be.disabled');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-4-disabled-button');
  });

  it('Test 5: Related resources actions label is displayed', () => {
    cy.enqueueLLMResponse({
      text: 'Here are the deployments in the namespace.',
      tool: {
        name: 'listKubernetesResources',
        args: {
          kind:      'Deployment',
          cluster:   'local',
          namespace: 'cattle-ai-agent-system',
        },
      },
    });

    chat.sendMessage('What deployments are there?');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.self().find('.chat-msg-action-title').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-5-section-label');
  });

  it('Test 6: "Show more" toggle appears when actions exceed threshold (>7)', () => {
    cy.enqueueLLMResponse({
      text: [
        'Here are the pods.',
        `<mcp-response>${JSON.stringify([{
          kind:      'Pod',
          type:      'v1/namespaces/default/pods',
          name:      ['pod-1', 'pod-2', 'pod-3', 'pod-4', 'pod-5', 'pod-6', 'pod-7', 'pod-8', 'pod-9'],
          cluster:   'local',
          namespace: 'default',
        }])}</mcp-response>`,
      ],
    });

    chat.sendMessage('List all pods in default namespace');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.self().find('.chat-msg-actions-more').should('be.visible');

    aiMessage.self().find('.chat-msg-actions-more').click();
    aiMessage.self().find('[data-testid^="rancher-ai-ui-chat-message-action-button-pod-8"]').should('be.visible');
    aiMessage.self().find('[data-testid^="rancher-ai-ui-chat-message-action-button-pod-9"]').should('be.visible');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-6-show-more');

    aiMessage.self().find('.chat-msg-actions-more').click();
    aiMessage.self().find('[data-testid^="rancher-ai-ui-chat-message-action-button-pod-8"]').should('not.exist');
  });

  it('Test 7: Resource action buttons are absent when no tool call is made', () => {
    cy.enqueueLLMResponse({ text: 'No resources to show.' });

    chat.sendMessage('Just give me text');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.self().find('[data-testid^="rancher-ai-ui-chat-message-action-button-"]').should('not.exist');
    aiMessage.self().find('.chat-actions-container').should('not.exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-7-no-actions');
  });

  it('Test 8: Resource action buttons persist when revisiting chat from history', () => {
    cy.enqueueLLMResponse({
      text: 'Here is the deployment you requested.',
      tool: {
        name: 'getKubernetesResource',
        args: {
          name:      'rancher-ai-agent',
          kind:      'Deployment',
          cluster:   'local',
          namespace: 'cattle-ai-agent-system',
        },
      },
    });

    chat.sendMessage('Show rancher-ai-agent deployment');

    const aiMessage = chat.getMessage(3);

    aiMessage.isCompleted();

    aiMessage.resourceButton('rancher-ai-agent').should('exist');

    const history = new HistoryPo();

    history.open();
    history.createChat();

    const newWelcome = chat.getMessage(1);

    newWelcome.isCompleted();

    history.open();
    history.chatItem(0).select();

    cy.wait(2000);
    cy.get('[data-testid^="rancher-ai-ui-chat-message-action-button-rancher-ai-agent"]').should('exist');

    cy.wait(500);
    cy.get('[data-testid="rancher-ai-ui-chat-container"]').screenshot('message-resource-actions-test-8-history-persistence');
  });
});
