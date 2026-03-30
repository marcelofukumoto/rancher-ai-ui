# E2E Test Plan: Context Feature

**Feature Area**: `context`
**Date Created**: 2026-03-30
**Spec File Location**: `cypress/e2e/tests/features/context.spec.ts`

## Source Components Analyzed

| File | Role |
|------|------|
| `pkg/rancher-ai-ui/components/context/ContextTag.vue` | Renders a single context tag chip with optional remove button |
| `pkg/rancher-ai-ui/components/context/SelectContext.vue` | Dropdown for toggling context items; renders selected tags |
| `pkg/rancher-ai-ui/components/panels/Context.vue` | Chat panel section wrapping `SelectContext` |
| `pkg/rancher-ai-ui/composables/useContextComposable.ts` | Exposes `context` (from store) and `selectContext()` handler |
| `pkg/rancher-ai-ui/store/context.ts` | Computes all active context (cluster, namespace, default, transient) |
| `pkg/rancher-ai-ui/pages/Chat.vue` | Wires `Context` panel; passes `disabled` when no permissions or errors |

---

## Known `data-testid` Selectors

| Selector | Element |
|----------|---------|
| `rancher-ai-ui-context-tag-{valueLabel\|value}` | Individual context tag chip (e.g. `rancher-ai-ui-context-tag-local` for the `local` cluster) |
| `rancher-ai-ui-chat-container` | Chat panel root |
| `rancher-ai-ui-chat-panel-ready` | Panel loaded indicator |
| `rancher-ai-ui-chat-console` | Console area |
| `rancher-ai-ui-chat-input-textarea` | Message textarea |
| `rancher-ai-ui-chat-message-box-{id}` | Message box by ID |

> **Note**: `SelectContext`'s dropdown trigger and dropdown items do not currently have `data-testid` attributes.
> Use `.context-trigger` (class) for the "Add context" button and `cy.contains()` for dropdown menu items.

---

## Test Cases

### Test 1: Context tags are shown when navigating to a cluster page

**Description**: Verifies that cluster context tags appear automatically in the context panel when the user is on a cluster-scoped page.

**Preconditions**:
- User is logged in
- Navigate to the Cluster Dashboard for `local`

**Steps**:
1. Navigate to the cluster dashboard: `ClusterDashboardPagePo.goTo('local')`.
2. Open the chat panel via `chat.open()`.
3. Wait for the chat panel to be ready: `chat.isReady()`.

**Assertions**:
- The context tag `[data-testid="rancher-ai-ui-context-tag-local"]` should exist within the chat container.

**Selectors**:
- `[data-testid="rancher-ai-ui-context-tag-local"]`

**Screenshot**: `context-test-1-cluster-context-tag-visible`

---

### Test 2: Context tags are NOT shown on the Home page

**Description**: Verifies that no cluster or namespace context tags are rendered on pages excluded from context (home, settings, auth).

**Preconditions**:
- User is logged in
- Navigate to the Home page

**Steps**:
1. `HomePagePo.goTo()`.
2. `chat.open()`.
3. `chat.isReady()`.

**Assertions**:
- No element matching `[data-testid^="rancher-ai-ui-context-tag-"]` should exist within the chat container.
- The "no context" message (text matching `i18n` key `ai.context.none`) should be visible inside `.chat-context`.

**Selectors**:
- `[data-testid^="rancher-ai-ui-context-tag-"]` (should not exist)
- `.chat-context .no-context` (should be visible)

**Screenshot**: `context-test-2-no-context-home-page`

---

### Test 3: Removing a context tag via the deselect button

**Description**: Verifies that clicking the remove (×) button on a context tag deselects and hides that tag.

**Preconditions**:
- User is logged in
- Navigate to the Cluster Dashboard for `local` so the `local` cluster tag is present

**Steps**:
1. `ClusterDashboardPagePo.goTo('local')` and `chat.open()`.
2. Wait for `[data-testid="rancher-ai-ui-context-tag-local"]` to exist.
3. Click the `.vs__deselect` button inside the tag: `cy.get('[data-testid="rancher-ai-ui-context-tag-local"]').parent().find('.vs__deselect').click()`.

**Assertions**:
- `[data-testid="rancher-ai-ui-context-tag-local"]` should no longer exist.
- The "reset" button (`.context-reset`) should be visible, indicating not all context is selected.

**Selectors**:
- `[data-testid="rancher-ai-ui-context-tag-local"] .vs__deselect` (via parent)
- `.context-reset`

**Screenshot**: `context-test-3-context-tag-removed`

---

### Test 4: Resetting context restores all tags

**Description**: Verifies that clicking the reset button re-adds all previously deselected context tags.

**Preconditions**:
- Continue from Test 3 state (one tag removed, reset button visible), OR:
- Navigate to `local` cluster dashboard, open chat, remove the `local` context tag so the reset button appears.

**Steps**:
1. Navigate to `ClusterDashboardPagePo.goTo('local')` and `chat.open()`.
2. Remove the `local` tag (click `.vs__deselect`).
3. Confirm `.context-reset` is visible.
4. Click the reset button: `cy.get('.context-reset button').click()`.

**Assertions**:
- `[data-testid="rancher-ai-ui-context-tag-local"]` should exist again.
- `.context-reset` should no longer be visible.

**Selectors**:
- `.context-reset button`
- `[data-testid="rancher-ai-ui-context-tag-local"]`

**Screenshot**: `context-test-4-context-reset`

---

### Test 5: Adding a context item via dropdown re-adds the tag

**Description**: Verifies that toggling an item in the context dropdown re-adds a previously removed tag.

**Preconditions**:
- Navigate to `local` cluster dashboard, open chat, remove the `local` context tag.

**Steps**:
1. Navigate to `ClusterDashboardPagePo.goTo('local')` and `chat.open()`.
2. Remove `local` tag.
3. Click the "Add context" dropdown trigger: `cy.get('.context-trigger').click()`.
4. Click the `cluster:local` menu item: `cy.contains('.context-dropdown [role="option"], [class*="rc-dropdown-item"]', 'cluster').click({ force: true })`.

**Assertions**:
- `[data-testid="rancher-ai-ui-context-tag-local"]` should exist again.

**Selectors**:
- `.context-trigger`
- `.context-dropdown` (dropdown container)

**Screenshot**: `context-test-5-context-added-via-dropdown`

---

### Test 6: Context tag is included in the sent message's metadata

**Description**: Verifies that when a message is sent, the response message shows the active context tag (cluster).

**Preconditions**:
- Navigate to the Cluster Dashboard for `local`
- Enqueue a mock LLM response

**Steps**:
1. `ClusterDashboardPagePo.goTo('local')` and `chat.open()`.
2. `chat.isReady()`.
3. `cy.enqueueLLMResponse({ text: 'Context received.' })`.
4. `chat.sendMessage('What is the cluster context?')`.

**Assertions**:
- `chat.getMessage(2)` (user message) exists.
- `chat.getMessage(3)` (AI response) `.context('local')` should exist — the `MessagePo.context()` method asserts `[data-testid="rancher-ai-ui-context-tag-local"]` within the message box.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-context-tag-local"]` (inside message box)

**Screenshot**: `context-test-6-context-in-message`

---

### Test 7: Context panel is disabled when chat is in processing state

**Description**: Verifies that the context panel shows the `disabled-panel` CSS class and the dropdown trigger is disabled while the chat is processing a response.

**Preconditions**:
- Navigate to `local` cluster dashboard, open chat
- Enqueue a slow-streaming mock LLM response (multiple chunks)

**Steps**:
1. `ClusterDashboardPagePo.goTo('local')` and `chat.open()`.
2. `chat.isReady()`.
3. Enqueue a multi-chunk response: `cy.enqueueLLMResponse({ text: ['Processing...', ' done.'], chunkSize: 1 })`.
4. `chat.sendMessage('Trigger processing')`.
5. While the AI is streaming, assert the disabled state.

**Assertions**:
- `.chat-context.disabled-panel` should exist while the response is streaming.
- The `.context-trigger` button should have `disabled` attribute or be non-interactive.

**Selectors**:
- `.chat-context.disabled-panel`
- `.context-trigger[disabled]`

**Screenshot**: `context-test-7-context-disabled-during-processing`

---

### Test 8: Namespace context tag appears when a namespace filter is active

**Description**: Verifies that when the user filters by a specific namespace (e.g. `default`), a namespace context tag is shown.

**Preconditions**:
- Navigate to a namespace-scoped page (e.g. Workloads → Deployments for namespace `default`)
- Set an active namespace filter

**Steps**:
1. Navigate to `WorkloadsDeploymentsListPagePo.goTo('local', 'apps.deployment')`.
2. Wait for page: `deploymentsPage.waitForPage()`.
3. Open the chat: `chat.open()`.
4. `chat.isReady()`.

**Assertions**:
- `[data-testid="rancher-ai-ui-context-tag-default"]` should exist (namespace tag for `default`).

**Selectors**:
- `[data-testid="rancher-ai-ui-context-tag-default"]`

**Screenshot**: `context-test-8-namespace-context-tag`

---

## Page Objects Needed

### New Page Objects
None required — all interactions use existing POs and direct `cy.get()` selectors.

> **Future consideration**: A `ContextPo` class wrapping `[data-chat-context]` or `.chat-context` could encapsulate the helpers below for reuse:
> - `contextTag(value: string)` → `cy.get('[data-testid="rancher-ai-ui-context-tag-{value}"]')`
> - `removeTag(value: string)` → click `.vs__deselect` inside the tag
> - `resetButton()` → `.context-reset button`
> - `dropdownTrigger()` → `.context-trigger`

### Reused Page Objects
| PO | Import | Used For |
|----|--------|----------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | `open()`, `isReady()`, `sendMessage()`, `getMessage()` |
| `MessagePo` | `@/cypress/e2e/po/message.po` | `context(label)`, `isCompleted()` |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | Navigate to home |
| `ClusterDashboardPagePo` | `@rancher/cypress/e2e/po/pages/explorer/cluster-dashboard.po` | Navigate to cluster page |
| `WorkloadsDeploymentsListPagePo` | `@rancher/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po` | Navigate to namespace-scoped page |

---

## Custom Commands

| Command | Used In | Purpose |
|---------|---------|---------|
| `cy.login()` | All tests | Authenticate before each test |
| `cy.enqueueLLMResponse({ text })` | Tests 6, 7 | Queue mock AI response |
| `cy.cleanChatHistory()` | `afterEach` | Clear chat state between tests |

---

## Mock Data

| Test | Mock |
|------|------|
| Test 6 | `cy.enqueueLLMResponse({ text: 'Context received.' })` |
| Test 7 | `cy.enqueueLLMResponse({ text: ['Processing...', ' done.'], chunkSize: 1 })` |

No API mocks needed beyond `cy.enqueueLLMResponse` — context is derived from the Rancher UI state (cluster/namespace).

---

## Spec File

```
cypress/e2e/tests/features/context.spec.ts
```

### Suggested Structure

```typescript
import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ClusterDashboardPagePo from '@rancher/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { WorkloadsDeploymentsListPagePo } from '@rancher/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import ChatPo from '@/cypress/e2e/po/chat.po';

describe('Context', () => {
  const chat = new ChatPo();

  beforeEach(() => { cy.login(); });
  afterEach(() => { cy.cleanChatHistory(); });

  it('Shows cluster context tag on cluster page', ...);            // Test 1
  it('Shows no context on home page', ...);                        // Test 2
  it('Removes a context tag via deselect button', ...);            // Test 3
  it('Resets context to restore all tags', ...);                   // Test 4
  it('Adds a context item via dropdown', ...);                     // Test 5
  it('Context tag is included in sent message metadata', ...);     // Test 6
  it('Context panel is disabled while processing', ...);           // Test 7
  it('Shows namespace context when namespace filter is active', ...); // Test 8
});
```
