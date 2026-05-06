# Test Plan: Context Feature

- **Feature Area**: context
- **Date Created**: 2026-05-06
- **Plan Type**: Initial
- **Source Components Analyzed**:
  - `pkg/rancher-ai-ui/components/context/SelectContext.vue`
  - `pkg/rancher-ai-ui/components/context/ContextTag.vue`
  - `pkg/rancher-ai-ui/components/panels/Context.vue`
  - `pkg/rancher-ai-ui/composables/useContextComposable.ts`
  - `pkg/rancher-ai-ui/store/context.ts`
  - `pkg/rancher-ai-ui/pages/Chat.vue`

---

## Overview

The Context panel sits between the messages area and the chat console. It surfaces
contextual information (current cluster, active namespaces, and UI hook–provided
resources) as tagged pills that are auto-selected and sent to the AI as additional
context with each message.

Key behaviors to test:

| Behavior | Source |
|----------|--------|
| "No context" shown on pages with no context (home, settings) | `store/context.ts` `allowProduct()` |
| Cluster tag shown when on a cluster page | `store/context.ts` `activeCluster` |
| Namespace tag shown when a namespace filter is active | `store/context.ts` `activeNamespaces` |
| All tags auto-selected by default | `SelectContext.vue` `autoSelect` prop |
| Individual tag removal via dropdown toggle | `SelectContext.vue` `removeItem()` |
| Individual tag re-addition via dropdown toggle | `SelectContext.vue` `addItem()` |
| Reset button restores all options | `SelectContext.vue` `reset()` |
| Context panel disabled when chat errors are present | `pages/Chat.vue` `:disabled` prop |

### Existing Coverage

The following is **already tested** in `cypress/e2e/tests/features/message.spec.ts`:

- *"Show context"* — navigates to the Deployments list page, opens chat, sends a
  message, and asserts that `resultMessage.context('local')` exists in the AI reply.

This plan covers the **context panel UI interactions** that are not yet tested.

---

## Test Cases

### Test 1: No context text shown on Home page

**Description**: When the user opens the chat from the Rancher Home page the context
store excludes cluster/namespace context (blocked by `allowProduct`), so the panel
must render the "No context" fallback.

**Preconditions**:
- User is logged in
- `HomePagePo.goTo()` has been called

**Steps**:
1. Navigate to the Rancher Home page.
2. Open the chat panel.
3. Wait for `rancher-ai-ui-chat-panel-ready`.
4. Assert that the text `"No context"` is visible inside the chat container.
5. Assert that the `.context-trigger` dropdown trigger is **not** present.

**Assertions**:
- `cy.contains('No context').should('be.visible')`
- `cy.get('.context-trigger').should('not.exist')`

**Selectors**:
- `.chat-context` — context panel wrapper
- `.context-trigger` — dropdown trigger button
- Text matcher: `No context` (i18n key `ai.context.none`)

**Screenshot**: `context-test-1-no-context-home`

---

### Test 2: Cluster context tag visible on cluster page

**Description**: When the user navigates to the Local cluster dashboard the store
adds a cluster context tag. The tag should appear automatically in the context panel.

**Preconditions**:
- User is logged in
- `ClusterDashboardPagePo('local').goTo()` has been called

**Steps**:
1. Navigate to the Local cluster dashboard.
2. Open the chat panel.
3. Wait for `rancher-ai-ui-chat-panel-ready`.
4. Assert the context tag for cluster "local" is visible.

**Assertions**:
- `cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('exist')`
- The tag label should contain the cluster display name.

**Selectors**:
- `[data-testid="rancher-ai-ui-context-tag-local"]` — dynamic testid using `valueLabel || value`

**Screenshot**: `context-test-2-cluster-tag-visible`

---

### Test 3: Context dropdown trigger opens options list

**Description**: Clicking the "Add context" trigger opens a dropdown listing all
available context options (those already selected have a remove icon).

**Preconditions**:
- User is logged in and on the cluster dashboard page so at least one context item exists
- Chat panel is open and ready

**Steps**:
1. Navigate to the Local cluster dashboard.
2. Open the chat panel.
3. Wait for `rancher-ai-ui-chat-panel-ready`.
4. Click the `.context-trigger` button.
5. Assert that the dropdown is open and contains the cluster option text.

**Assertions**:
- `cy.contains('.context-dropdown', 'cluster:local').should('be.visible')`
- The cluster option text (e.g. `cluster:local`) is present in the dropdown list

**Selectors**:
- `.context-trigger` — dropdown button
- `.context-dropdown` — the dropdown root

**Screenshot**: `context-test-3-dropdown-open`

---

### Test 4: Removing a context tag via dropdown

**Description**: Clicking an already-selected item in the dropdown removes the
corresponding `ContextTag` pill from the panel.

**Preconditions**:
- User is logged in and on the cluster dashboard page
- Chat panel is open and ready
- Context dropdown is open

**Steps**:
1. Navigate to the Local cluster dashboard.
2. Open the chat panel and wait for ready state.
3. Assert `[data-testid="rancher-ai-ui-context-tag-local"]` exists (auto-selected).
4. Click the `.context-trigger` button to open the dropdown.
5. Click the dropdown item for the cluster (contains `cluster:local`).
6. Assert that `[data-testid="rancher-ai-ui-context-tag-local"]` no longer exists.

**Assertions**:
- After click: `cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('not.exist')`

**Selectors**:
- `[data-testid="rancher-ai-ui-context-tag-local"]`
- `.context-trigger`

**Screenshot**: `context-test-4-tag-removed`

---

### Test 5: Re-adding a removed context tag

**Description**: After removing an item, clicking it again in the dropdown adds it
back as a tag.

**Preconditions**:
- User is logged in and on the cluster dashboard page
- The cluster context tag has been removed (see Test 4)
- Context dropdown is open

**Steps**:
1. Navigate to the Local cluster dashboard.
2. Open the chat panel and wait for ready state.
3. Remove the cluster tag via the dropdown (same as Test 4).
4. Click the `.context-trigger` button again.
5. Click the cluster dropdown item again to re-select it.
6. Assert that `[data-testid="rancher-ai-ui-context-tag-local"]` exists again.

**Assertions**:
- `cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').should('exist')`

**Selectors**:
- `[data-testid="rancher-ai-ui-context-tag-local"]`
- `.context-trigger`

**Screenshot**: `context-test-5-tag-readded`

---

### Test 6: Reset button restores all context tags

**Description**: When at least one context item is deselected the Reset button
appears. Clicking it restores the full selection.

**Preconditions**:
- User is logged in and on the cluster dashboard page
- At least one context tag has been removed so the reset button is visible

**Steps**:
1. Navigate to the Local cluster dashboard.
2. Open the chat panel and wait for ready state.
3. Remove the cluster context tag via the dropdown.
4. Assert that `.context-reset` button is visible.
5. Click the `.context-reset` button.
6. Assert that `[data-testid="rancher-ai-ui-context-tag-local"]` exists again.
7. Assert that `.context-reset` is no longer visible (all items selected).

**Assertions**:
- Before reset: `.context-reset` is visible
- After reset: `[data-testid="rancher-ai-ui-context-tag-local"]` exists
- After reset: `.context-reset` is not visible

**Selectors**:
- `.context-reset` — reset button wrapper
- `[data-testid="rancher-ai-ui-context-tag-local"]`

**Screenshot**: `context-test-6-reset-restores-tags`

---

### Test 7: Context panel is disabled during error state

**Description**: When the AI service has connectivity problems the `disabled` prop
is passed to the Context panel, preventing user interaction with the dropdown.

**Preconditions**:
- User is logged in
- Chat panel is open
- The AI service WebSocket connection is deliberately broken / not available so
  the panel enters an error / not-ready state (`rancher-ai-ui-chat-panel-not-ready`)

**Steps**:
1. Navigate to a page where context exists (cluster dashboard).
2. Open the chat panel.
3. Wait until `rancher-ai-ui-chat-panel-not-ready` is present (connection failure).
4. Assert that the context panel wrapper has the `disabled-panel` class.

**Assertions**:
- `cy.get('.chat-context').should('have.class', 'disabled-panel')`

**Selectors**:
- `.chat-context` — context panel root (receives `disabled-panel` class when `disabled=true`)
- `[data-testid="rancher-ai-ui-chat-panel-not-ready"]`

**Screenshot**: `context-test-7-disabled-state`

---

### Test 8: Context tags sent to AI in message

**Description**: Validates end-to-end that selected context items are transmitted
to the AI service. The AI mock response includes the cluster name referenced in
context, and the user message object stores the selected context.

> **Note**: The happy-path is already covered in `message.spec.ts` ("Show context"
> test). This case verifies the behaviour **after manually deselecting** a context
> item — the deselected item should **not** appear as context in the resulting
> message object.

**Preconditions**:
- User is logged in and on the cluster dashboard page
- Chat panel is open and ready
- LLM mock is enqueued

**Steps**:
1. Navigate to the Local cluster dashboard.
2. Open the chat panel and wait for ready state.
3. Remove the cluster context tag via the dropdown.
4. Enqueue an LLM mock response: `cy.enqueueLLMResponse({ text: 'Acknowledged.' })`.
5. Send a message: `chat.sendMessage('Hello without cluster context')`.
6. Wait for the AI response to complete.
7. Assert that `resultMessage.context('local')` does **not** exist.

**Assertions**:
- `chat.getMessage(3).context('local').should('not.exist')`

**Selectors**:
- `MessagePo.context(clusterName)` — existing PO method
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`

**Screenshot**: `context-test-8-deselected-context-not-sent`

---

## Page Objects Needed

### Reuse existing
| PO | Import | Used for |
|----|--------|----------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | Open/close chat, send messages, get messages |
| `MessagePo` | `@/cypress/e2e/po/message.po` | Assert context presence on messages |
| `ClusterDashboardPagePo` | `@rancher/cypress/e2e/po/pages/explorer/cluster-dashboard.po` | Navigate to cluster page |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | Navigate to home page |

### New PO (optional)
A lightweight `ContextPo` helper could be added at `cypress/e2e/po/context.po.ts`
to encapsulate context panel interactions:

```typescript
import ComponentPo from '@rancher/cypress/e2e/po/components/component.po';

export class ContextPo extends ComponentPo {
  constructor() {
    super('.chat-context');
  }

  trigger() {
    return this.self().find('.context-trigger');
  }

  tag(value: string) {
    return cy.get(`[data-testid="rancher-ai-ui-context-tag-${ value }"]`);
  }

  resetButton() {
    return this.self().find('.context-reset button');
  }

  noContextText() {
    return this.self().contains('No context');
  }

  openDropdown() {
    this.trigger().click();
    return this;
  }

  toggleItem(labelText: string) {
    cy.contains('.context-dropdown', labelText).click();
    return this;
  }
}
```

---

## Custom Commands

| Command | Usage |
|---------|-------|
| `cy.login()` | Authenticate before each test |
| `cy.cleanChatHistory()` | Clear chat history in `afterEach` |
| `cy.enqueueLLMResponse({ text })` | Queue mock AI response before sending a message |

---

## Mock Data

| Test | Mock needed |
|------|-------------|
| Tests 1–6 | No LLM mock needed (UI-only interactions) |
| Test 7 | Connection failure state — no specific mock, rely on the service being unavailable or use a custom approach if the environment supports it |
| Test 8 | `cy.enqueueLLMResponse({ text: 'Acknowledged.' })` |

---

## Spec File Location

```
cypress/e2e/tests/features/context.spec.ts
```
