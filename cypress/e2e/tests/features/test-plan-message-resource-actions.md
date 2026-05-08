# Test Plan: Message Resource Action Buttons

**Feature Area**: `message-resource-actions`
**Date Created**: 2026-05-08
**Plan Type**: Initial
**Spec File Location**: `cypress/e2e/tests/features/message-resource-actions.spec.ts`

## Source Components Analyzed

| File | Role |
|------|------|
| `pkg/rancher-ai-ui/components/message/action/index.vue` | Container component — renders a list of `Action` items; has `THRESHOLD = 7` for "show more/less" toggle |
| `pkg/rancher-ai-ui/components/message/action/Action.vue` | Individual action — renders as an `RcButton` (`ActionType.Button`) or `<a>` link (`ActionType.Link`); `data-testid` is `rancher-ai-ui-chat-message-action-button-{resource.name}` |
| `pkg/rancher-ai-ui/components/message/index.vue` | Renders `<Actions>` twice: once for `relatedResourcesActions` (label: `ai.message.relatedResourcesActions.label`) and once for `actions` (label: `ai.message.quickActions.label`) |
| `pkg/rancher-ai-ui/utils/format.ts` | `formatMessageRelatedResourcesActions()` — parses `<mcp-response>…</mcp-response>` tags from WS messages into `MessageAction[]` |
| `pkg/rancher-ai-ui/composables/useChatMessageComposable.ts` | Populates `relatedResourcesActions` when WS data starts with `Tag.McpResultStart` (`<mcp-response>`) |
| `pkg/rancher-ai-ui/types.ts` | `MessageAction`, `ActionType` (Button / Link), `ActionResource` definitions; `Tag.McpResultStart = '<mcp-response>'` |
| `cypress/e2e/po/message.po.ts` | `resourceButton(resourceIdPrefix)` — selects `[data-testid^="rancher-ai-ui-chat-message-action-button-{prefix}"]` |
| `cypress/support/commands/llm-mock-service-api.ts` | `cy.enqueueLLMResponse({ tool: { name, args } })` — triggers MCP tool call flow that generates action buttons |

## Key Behavior Notes

- **`relatedResourcesActions`** are generated when the AI agent uses a `listKubernetesResources` or `getKubernetesResource` tool call via the MCP server. The mock service's `tool` option triggers this flow.
- The `Action.vue` `data-testid` is `rancher-ai-ui-chat-message-action-button-{resource.name}`. When the resource name is an array, each entry gets its own button.
- A button is **enabled** only when the resource is found in the Rancher store (via `store.getters['management/byId']`). If not found, the button is rendered but disabled (`!to` → `:disabled="!to"`).
- The **"show more"** link appears only when `remaining.length > 0` (i.e., more than `THRESHOLD = 7` actions). CSS class: `.chat-msg-actions-more`.
- Action buttons are always `ActionType.Button` when produced by `formatMessageRelatedResourcesActions` (the default `actionType` arg is `ActionType.Button`).
- The label above the actions container comes from the i18n key — for `relatedResourcesActions` it is `ai.message.relatedResourcesActions.label`.
- **Message ID sequence** (after `cy.cleanChatHistory()`): `1` = welcome (AI), `2` = first user message, `3` = first AI response, `4` = second user message, `5` = second AI response, etc.
- The cluster `local` is always present in a default Rancher dev environment. Deployments in `cattle-ai-agent-system` exist there as part of the AI stack.

## Test Cases

### Test 1: `getKubernetesResource` generates a single resource action button

**Description**: Verifies that when the AI agent uses `getKubernetesResource` for a known deployment, a single enabled resource action button appears in the AI response.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) has been received and completed

**Steps**:
1. Enqueue a mock response with `tool: { name: 'getKubernetesResource', args: { name: 'rancher-ai-agent', kind: 'Deployment', cluster: 'local', namespace: 'cattle-ai-agent-system' } }`
2. Send a message: `'Show me the rancher-ai-agent deployment'`
3. Wait for the AI response (ID 3) to complete

**Assertions**:
- `chat.getMessage(3).resourceButton('rancher-ai-agent')` exists
- The button is not disabled (`:disabled` attribute is absent / `to` resolves in store)

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] [data-testid^="rancher-ai-ui-chat-message-action-button-rancher-ai-agent"]`

**Screenshot**: `message-resource-actions-test-1-single-button`

---

### Test 2: `listKubernetesResources` generates multiple resource action buttons

**Description**: Verifies that when the AI agent uses `listKubernetesResources` for a namespace with multiple deployments, multiple resource action buttons appear.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) received and completed

**Steps**:
1. Enqueue a mock response with `tool: { name: 'listKubernetesResources', args: { kind: 'Deployment', cluster: 'local', namespace: 'cattle-ai-agent-system' } }`
2. Send a message: `'List all deployments in cattle-ai-agent-system'`
3. Wait for AI response (ID 3) to complete

**Assertions**:
- `chat.getMessage(3)` contains at least one `[data-testid^="rancher-ai-ui-chat-message-action-button-"]` element
- `.chat-msg-action-tags` wrapper is present in message 3

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] [data-testid^="rancher-ai-ui-chat-message-action-button-"]`
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-msg-action-tags`

**Screenshot**: `message-resource-actions-test-2-multiple-buttons`

---

### Test 3: Resource action button navigates to the resource detail page

**Description**: Verifies that clicking an enabled resource action button routes the user to the resource's detail page in the cluster explorer.

**Preconditions**:
1. User is logged in, on Home page
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) completed

**Steps**:
1. Enqueue a mock response with `tool: { name: 'getKubernetesResource', args: { name: 'rancher-ai-agent', kind: 'Deployment', cluster: 'local', namespace: 'cattle-ai-agent-system' } }`
2. Send a message: `'Navigate to rancher-ai-agent deployment'`
3. Wait for AI response (ID 3) to complete
4. Click `chat.getMessage(3).resourceButton('rancher-ai-agent')`

**Assertions**:
- After click, `cy.url()` contains `'/local/apps.deployment/'` and `'rancher-ai-agent'`
- The deployments detail page is shown (contains `'rancher-ai-agent'`)

**Selectors**:
- `[data-testid^="rancher-ai-ui-chat-message-action-button-rancher-ai-agent"] button`

**Screenshot**: `message-resource-actions-test-3-navigation`

---

### Test 4: Resource action button is disabled for unknown resources

**Description**: Verifies that a resource action button is rendered in a disabled state when the AI references a resource that cannot be found in the Rancher store.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) completed

**Steps**:
1. Enqueue a mock response with `tool: { name: 'getKubernetesResource', args: { name: 'nonexistent-resource-xyz', kind: 'Deployment', cluster: 'local', namespace: 'default' } }`
2. Send a message: `'Show me nonexistent-resource-xyz'`
3. Wait for AI response (ID 3) to complete

**Assertions**:
- `chat.getMessage(3).resourceButton('nonexistent-resource-xyz')` exists
- The button element has `disabled` attribute or `.btn-disabled` class (`:disabled="!to"` in `Action.vue`)

**Selectors**:
- `[data-testid^="rancher-ai-ui-chat-message-action-button-nonexistent-resource-xyz"] button`

**Screenshot**: `message-resource-actions-test-4-disabled-button`

---

### Test 5: Related resources actions label is displayed

**Description**: Verifies that the actions section heading (from `ai.message.relatedResourcesActions.label` i18n key) is rendered above the action buttons.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) completed

**Steps**:
1. Enqueue a mock response with `tool: { name: 'listKubernetesResources', args: { kind: 'Deployment', cluster: 'local', namespace: 'cattle-ai-agent-system' } }`
2. Send a message: `'What deployments are there?'`
3. Wait for AI response (ID 3) to complete

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-msg-action-title` is visible
- The `.chat-msg-action-title` element contains the expected label text (e.g., `'Related Resources'` or matching `ai.message.relatedResourcesActions.label`)

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-msg-action-title`

**Screenshot**: `message-resource-actions-test-5-section-label`

---

### Test 6: "Show more" toggle appears when actions exceed threshold (>7)

**Description**: Verifies the "show more" / "show less" toggle appears when the AI response contains more than 7 resource action buttons, and that it expands/collapses the remaining items.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) completed

**Steps**:
1. Enqueue a mock response where `text` includes a `<mcp-response>` block with 9 resource names (array form): e.g., `tool: { name: 'listKubernetesResources', args: { kind: 'Pod', cluster: 'local', namespace: 'default' } }` — or craft the mock to return >7 results by using a namespace known to have many pods
2. Send a message: `'List all pods in default namespace'`
3. Wait for AI response (ID 3) to complete

**Assertions**:
- `.chat-msg-actions-more` link is visible in message 3
- The link text contains the count of hidden items (e.g., `'+2 more'` or similar from `ai.message.actions.more`)
- Click `.chat-msg-actions-more` → remaining action buttons are now visible
- The link text changes to the "show less" label (`ai.message.actions.less`)
- Click `.chat-msg-actions-more` again → remaining buttons are hidden

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-msg-actions-more`

**Screenshot**: `message-resource-actions-test-6-show-more`

---

### Test 7: Resource action buttons are absent when no tool call is made

**Description**: Verifies that a plain-text AI response with no MCP tool call does not render any resource action buttons.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) completed

**Steps**:
1. Enqueue a plain text response: `cy.enqueueLLMResponse({ text: 'No resources to show.' })`
2. Send a message: `'Just give me text'`
3. Wait for AI response (ID 3) to complete

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] [data-testid^="rancher-ai-ui-chat-message-action-button-"]` does not exist
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-actions-container` does not exist

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-actions-container`

**Screenshot**: `message-resource-actions-test-7-no-actions`

---

### Test 8: Resource action buttons persist when revisiting chat from history

**Description**: Verifies that resource action buttons are still rendered when a user revisits an existing conversation from the history panel.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) completed
4. At least one resource action button has been generated (via tool call)

**Steps**:
1. Enqueue a mock response with `tool: { name: 'getKubernetesResource', args: { name: 'rancher-ai-agent', kind: 'Deployment', cluster: 'local', namespace: 'cattle-ai-agent-system' } }`
2. Send a message: `'Show rancher-ai-agent deployment'`
3. Wait for AI response (ID 3) to complete
4. Open the history panel
5. Create a new chat (`history.createChat()`)
6. Wait for new chat welcome (ID 1) to complete
7. Re-open the history panel and select the original chat item

**Assertions**:
- After re-selecting the original chat, `chat.getMessage(3).resourceButton('rancher-ai-agent')` exists
- The button is rendered (not hidden or missing after re-hydration from history)

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"] [data-testid^="rancher-ai-ui-chat-message-action-button-rancher-ai-agent"]`

**Screenshot**: `message-resource-actions-test-8-history-persistence`

---

## Page Objects Needed

### Reuse existing

| PO | Import Path | Methods used |
|----|-------------|--------------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | `open()`, `isReady()`, `sendMessage()`, `getMessage()` |
| `MessagePo` (via `chat.getMessage()`) | `@/cypress/e2e/po/message.po` | `resourceButton(prefix)`, `isCompleted()`, `containsText()` |
| `HistoryPo` | `@/cypress/e2e/po/history.po` | `open()`, `createChat()`, `chatItem(index).select()` |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | `goTo()` |

### No new PO classes required

The existing `MessagePo.resourceButton()` method covers the main selector needed. Additional CSS-class-based assertions (`'.chat-msg-actions-more'`, `'.chat-actions-container'`) can be done directly via `cy.get()` scoped within the message box selector.

---

## Custom Commands

| Command | Usage |
|---------|-------|
| `cy.login()` | Auth before each test |
| `cy.enqueueLLMResponse({ tool: { name, args } })` | Queue a mock AI tool call response |
| `cy.cleanChatHistory()` | Reset chat state in `afterEach` |

---

## Mock Data

### `getKubernetesResource` — single known resource
```typescript
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
```

### `listKubernetesResources` — multiple resources
```typescript
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
```

### Plain text (no tool call)
```typescript
cy.enqueueLLMResponse({ text: 'No resources to show.' });
```
