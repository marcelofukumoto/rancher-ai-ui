# Multi-Agent Feature — MCP E2E Test Plan

**Feature area**: `multi-agent`
**Date created**: 2026-04-17
**Plan type**: Initial
**Execution method**: MCP Playwright

## Source components analyzed

- `pkg/rancher-ai-ui/components/agent/SelectAgent.vue`
- `pkg/rancher-ai-ui/components/panels/Console.vue` (`v-if="props.agents.length > 1"` gate)
- `pkg/rancher-ai-ui/components/message/index.vue` (agent label on assistant messages)
- `pkg/rancher-ai-ui/composables/useAgentComposable.ts`
- `pkg/rancher-ai-ui/composables/useChatMessageComposable.ts` (Tag.AgentMetadataStart parsing)
- `pkg/rancher-ai-ui/utils/format.ts` (`formatAgentMetadata`)
- `pkg/rancher-ai-ui/l10n/en-us.yaml` (i18n strings)
- `cypress/e2e/tests/features/multi-agent/chat.spec.ts`
- `cypress/e2e/tests/features/multi-agent/message.spec.ts`

---

## Prerequisites

- Application URL: `https://localhost:8005`
- Login credentials: username `admin`, password from `CATTLE_BOOTSTRAP_PASSWORD` environment variable (use `password` as fallback)
- Self-signed certificate: configure Playwright to ignore HTTPS errors (`ignoreHTTPSErrors: true`)
- LLM mock service: `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy`
- At least **two active agents** must be present for multi-agent tests. The default environment has `rancher`, `fleet`, and `provisioning` agent configs. If the SelectAgent dropdown is not visible after login, create a harvester agent config via the API before running Tests 2–8 (see "Setup: Create harvester agent" below).
- Clean chat history before each test (start a new chat).

### Setup: Create harvester agent (if needed)

After logging in, if `[data-testid="rancher-ai-ui-multi-agent-select"]` is not visible in the chat console, create a harvester agent config by sending the following API request using `fetch` from the browser console or via Playwright `page.evaluate()`:

```
Method: POST
URL: https://localhost:8005/v1/ai.cattle.io.aiagentconfig
Headers:
  Content-Type: application/json
  x-api-csrf: <value of the CSRF cookie>
Body:
{
  "apiVersion": "ai.cattle.io/v1alpha1",
  "kind": "AIAgentConfig",
  "metadata": {
    "name": "harvester",
    "namespace": "cattle-ai-agent-system"
  },
  "spec": {
    "authenticationType": "RANCHER",
    "builtIn": true,
    "description": "Harvester agent description",
    "displayName": "Harvester",
    "enabled": true,
    "mcpURL": "rancher-mcp-server.cattle-ai-agent-system.svc",
    "systemPrompt": "Harvester system prompt",
    "toolSet": "harvester"
  }
}
```

Wait for the chat to reconnect after creating the agent (the SelectAgent dropdown should appear).

### Cleanup: Delete harvester agent (after all tests)

If the harvester agent was created for these tests, delete it:

```
Method: DELETE
URL: https://localhost:8005/v1/ai.cattle.io.aiagentconfig/cattle-ai-agent-system/harvester
Headers:
  x-api-csrf: <value of the CSRF cookie>
```

### Mock API: Enqueue LLM response

To enqueue a mock LLM response, send a POST request (use `page.evaluate()` with `fetch` in Playwright):

```
Method: POST
URL: https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Headers:
  Content-Type: application/json
  Cookie: R_SESS=<value of R_SESS cookie after login>
Body (adaptive mode — agent selected automatically):
{
  "agent": "rancher",
  "text": { "chunks": ["Hello from the Rancher agent."] }
}

Body (manual mode — agent explicitly selected by user):
{
  "agent": null,
  "text": { "chunks": ["Manual mode response."] }
}

Body (adaptive mode with harvester agent):
{
  "agent": "harvester",
  "text": { "chunks": ["Hello from the Harvester agent."] }
}
```

---

## Key Selectors

| Selector | Component | Notes |
|---|---|---|
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | `pages/Chat.vue` | Wait for this after opening chat |
| `[data-testid="rancher-ai-ui-multi-agent-select"]` | `SelectAgent.vue` | Root container; only rendered when `agents.length > 1` |
| `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` | `SelectAgent.vue` | Adaptive mode option; only rendered when `activeAgents.length > 1` |
| `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` | `SelectAgent.vue` | Rancher agent option |
| `[data-testid="rancher-ai-ui-multi-agent-select-option-harvester"]` | `SelectAgent.vue` | Harvester agent option |
| `.agent-trigger` | `SelectAgent.vue` | Dropdown trigger button (click to open/close) |
| `.selected-agent-name` | `SelectAgent.vue` | Span displaying the currently selected agent name |
| `.icon-checkmark.hidden` | `SelectAgent.vue` | Checkmark hidden with CSS `visibility:hidden`; visible when `opt.name === selectedAgentName` |
| `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-{agentName}"]` | `message/index.vue` | Agent label on an assistant message; only present when `agentMetadata?.agent` is set |
| `[data-testid="rancher-ai-ui-chat-input-textarea"]` | `panels/Console.vue` | Message input textarea |
| `[data-testid="rancher-ai-ui-chat-message-box-{N}"]` | `panels/Messages.vue` | Individual message box (1-based ID from store) |
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | `pages/Chat.vue` | Panel ready indicator |

---

## i18n Verified Strings

| Key | Value |
|---|---|
| `ai.agents.items.default.displayName` | `Adaptive Agent Selection` |
| `ai.agents.selectionMode.auto` | `(Adaptive Mode)` |
| `ai.agents.selectionMode.manual` | `` (empty string) |
| `ai.agents.selectedAgent.label` | `Agent: {agent}` |
| `ai.agents.items.unavailable` | `This AI agent is currently unavailable...` |

---

## Test Cases

---

### Test 1: SelectAgent dropdown is visible when multiple agents are enabled

**Description**: Verify that the `rancher-ai-ui-multi-agent-select` component is rendered in the chat console when multiple agent configs are enabled (≥2 agents).

**Preconditions**:
- Multiple agents must be enabled (run the "Setup: Create harvester agent" steps if needed).
- User is not yet logged in.

**Steps**:
1. Navigate to `https://localhost:8005` (ignore self-signed certificate errors).
2. On the login page, enter username `admin` and the password.
3. Click the "Log In" button and wait for the Rancher Dashboard home page to load.
4. Open the chat panel: click the AI assistant button in the Rancher header, or press `Alt+K`.
5. Wait for the element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to become visible (up to 30 seconds).
6. Take a screenshot named `multi-agent-mcp-test-1-dropdown-visible`.

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select"]` is visible in the DOM.
- The `.selected-agent-name` text inside the dropdown trigger reads `Adaptive Agent Selection`.

**Screenshot**: `multi-agent-mcp-test-1-dropdown-visible`

---

### Test 2: Dropdown shows "Adaptive Agent Selection" by default when multiple agents are active

**Description**: Verify the default state of the agent selector shows "Adaptive Agent Selection" when more than one agent is in the Active state.

**Preconditions**:
- Multiple active agents present.
- Chat panel is open and ready.
- No agent has been manually selected (fresh chat session).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Locate the element `[data-testid="rancher-ai-ui-multi-agent-select"]`.
4. Read the text content of `.selected-agent-name` inside the dropdown.
5. Take a screenshot named `multi-agent-mcp-test-2-default-adaptive`.

**Assertions**:
- `.selected-agent-name` text content is exactly `Adaptive Agent Selection`.
- The dropdown trigger is not disabled (the `.agent-trigger` button does not have the `disabled` attribute).

**Screenshot**: `multi-agent-mcp-test-2-default-adaptive`

---

### Test 3: Opening the agent dropdown shows agent options including Adaptive and individual agents

**Description**: Verify that clicking the agent selector trigger opens the dropdown and shows the Adaptive Agent Selection option as well as the individual agent options (rancher, harvester).

**Preconditions**:
- Multiple active agents present (rancher + harvester).
- Chat panel is open and ready.
- Agent is currently set to Adaptive (default).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Click the `.agent-trigger` button inside `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown.
4. Wait ~300ms for the dropdown animation.
5. Take a screenshot named `multi-agent-mcp-test-3-dropdown-open`.

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` is visible.
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` is visible.
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-harvester"]` is visible.
- The text "Adaptive Agent Selection" is present in the dropdown.
- The text "Harvester" is present in the dropdown.

**Screenshot**: `multi-agent-mcp-test-3-dropdown-open`

---

### Test 4: Adaptive Agent Selection option shows checkmark when selected

**Description**: Verify that the `__adaptive__` option in the dropdown has its checkmark icon visible (not hidden via CSS) when the current selection is Adaptive Agent Selection.

**Preconditions**:
- Multiple active agents present.
- Chat panel is open and ready.
- Current selection is Adaptive (default).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Click the `.agent-trigger` button inside `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown.
4. Wait ~300ms for the dropdown to open.
5. Locate the `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` element.
6. Find the `.icon-checkmark` element within this option.
7. Take a screenshot named `multi-agent-mcp-test-4-adaptive-checkmark`.

**Assertions**:
- The `.icon-checkmark` within `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` does NOT have the `.hidden` CSS class (meaning it is visible).
- The `.icon-checkmark` within `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` DOES have the `.hidden` CSS class (meaning rancher is not selected).

**Screenshot**: `multi-agent-mcp-test-4-adaptive-checkmark`

---

### Test 5: Selecting a manual agent updates the trigger display name

**Description**: Verify that clicking a specific agent (e.g., rancher) in the dropdown closes the dropdown and updates the `.selected-agent-name` text to that agent's display name.

**Preconditions**:
- Multiple active agents present.
- Chat panel is open and ready.
- Current selection is Adaptive (default).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Confirm `.selected-agent-name` reads `Adaptive Agent Selection`.
4. Click the `.agent-trigger` button inside `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown.
5. Wait ~300ms for the dropdown to open.
6. Click the element `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]`.
7. Wait ~300ms for the dropdown to close and the selection to update.
8. Take a screenshot named `multi-agent-mcp-test-5-manual-agent-selected`.

**Assertions**:
- The `.selected-agent-name` text content is no longer `Adaptive Agent Selection`.
- The `.selected-agent-name` text content contains `Rancher` (the display name of the rancher agent).
- The dropdown is closed (the option elements are no longer visible).

**Screenshot**: `multi-agent-mcp-test-5-manual-agent-selected`

---

### Test 6: AI response in adaptive mode shows agent label with "(Adaptive Mode)"

**Description**: Verify that when a mock LLM response is enqueued with `agent: "rancher"` (adaptive mode), the assistant message shows a label `Agent: Rancher (Adaptive Mode)`.

**Preconditions**:
- Multiple active agents present.
- Chat panel is open and ready.
- Current selection is Adaptive Agent Selection (default — do NOT manually switch agents).
- Message sequence in this test: msg-1 = welcome message (ID 1), msg-2 = user message (ID 2), msg-3 = assistant response (ID 3).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Wait for the welcome message (ID 1) to complete.
4. Enqueue a mock LLM response in adaptive mode using Playwright `page.evaluate()`:
   ```
   POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
   Body: { "agent": "rancher", "text": { "chunks": ["This is a test response from adaptive mode."] } }
   Cookie: R_SESS=<R_SESS cookie value>
   ```
5. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type `Tell me about Rancher.`.
6. Press Enter to send the message.
7. Wait for the element `[data-testid="rancher-ai-ui-chat-message-box-3"]` to become visible.
8. Wait for the assistant message to complete (wait ~3 seconds after it appears).
9. Take a screenshot named `multi-agent-mcp-test-6-adaptive-agent-label`.

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"]` is visible.
- Within message box 3, the element `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` is present.
- The text content of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` contains `Rancher`.
- The text content of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` contains `(Adaptive Mode)`.

**Screenshot**: `multi-agent-mcp-test-6-adaptive-agent-label`

---

### Test 7: AI response in manual mode shows agent label without "(Adaptive Mode)"

**Description**: Verify that when a mock LLM response is enqueued with `agent: null` (manual mode), the assistant message shows the agent label without the "(Adaptive Mode)" suffix.

**Preconditions**:
- Multiple active agents present.
- Chat panel is open and ready.
- User has manually selected the `rancher` agent (perform the steps from Test 5 first to switch to manual rancher selection).
- Message sequence: msg-1 = welcome (ID 1), msg-2 = user (ID 2), msg-3 = assistant response (ID 3).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Wait for the welcome message (ID 1) to complete.
4. Click `.agent-trigger` inside `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown.
5. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` to select the rancher agent manually.
6. Verify `.selected-agent-name` shows `Rancher` (manual mode now active).
7. Enqueue a mock LLM response in manual mode using Playwright `page.evaluate()`:
   ```
   POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
   Body: { "agent": null, "text": { "chunks": ["This is a test response from manual mode."] } }
   Cookie: R_SESS=<R_SESS cookie value>
   ```
8. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type `Tell me about Rancher.`.
9. Press Enter to send.
10. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to become visible.
11. Wait ~3 seconds for the message to complete.
12. Take a screenshot named `multi-agent-mcp-test-7-manual-agent-label`.

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"]` is visible.
- Within message box 3, the element `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` is present.
- The text of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` contains `Rancher`.
- The text of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` does NOT contain `(Adaptive Mode)`.

**Screenshot**: `multi-agent-mcp-test-7-manual-agent-label`

---

### Test 8: Restoring Adaptive Agent Selection from manual mode

**Description**: Verify that after selecting an agent manually, a user can switch back to Adaptive Agent Selection by clicking the `__adaptive__` option, and the trigger shows "Adaptive Agent Selection" again.

**Preconditions**:
- Multiple active agents present.
- Chat panel is open and ready.
- User is currently in manual mode (rancher agent selected — perform Test 5 steps first).

**Steps**:
1. Navigate to `https://localhost:8005`, log in as `admin`.
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
3. Click `.agent-trigger` inside `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown.
4. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` to switch to manual rancher selection.
5. Verify `.selected-agent-name` shows `Rancher`.
6. Click `.agent-trigger` again to re-open the dropdown.
7. Wait ~300ms for the dropdown to open.
8. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` to switch back to Adaptive.
9. Wait ~300ms for the dropdown to close and selection to update.
10. Take a screenshot named `multi-agent-mcp-test-8-restore-adaptive`.

**Assertions**:
- The `.selected-agent-name` text content is `Adaptive Agent Selection` after clicking the adaptive option.
- The dropdown is closed.
- When re-opening the dropdown, the `.icon-checkmark` within `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` does NOT have the `.hidden` CSS class.
- The `.icon-checkmark` within `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` DOES have the `.hidden` CSS class.

**Screenshot**: `multi-agent-mcp-test-8-restore-adaptive`

---

## Mock Data Setup Summary

| Test | Agent mode | Mock push body |
|---|---|---|
| Test 6 | Adaptive (rancher) | `{ "agent": "rancher", "text": { "chunks": ["This is a test response from adaptive mode."] } }` |
| Test 7 | Manual | `{ "agent": null, "text": { "chunks": ["This is a test response from manual mode."] } }` |

## Implementation Notes

- The SelectAgent component (`rancher-ai-ui-multi-agent-select`) is rendered by `v-if="props.agents.length > 1"` in `Console.vue`. It requires at least 2 enabled agent configs to appear in the DOM. If only 1 config exists, the element will be absent from the DOM entirely.
- The Adaptive Agent Selection option (`__adaptive__`) is only shown when `activeAgentNames.length > 1`. If multiple agents are enabled but only 1 is Active, the `__adaptive__` option won't appear (only individual agent options are shown).
- The agent label on assistant messages (`rancher-ai-ui-chat-message-selected-agent-label-{name}`) only renders when `props.message.agentMetadata?.agent` is truthy. With `agent: "rancher"` in the mock push, the stream carries an `AgentMetadataStart` tag with `{ agentName: "rancher", selectionMode: "auto" }`, which the composable parses and stores on the message.
- With `agent: null` in the mock push (manual mode), the server responds with an `AgentMetadataStart` tag carrying the agent's name (e.g., `rancher`) but with `selectionMode: "manual"`, resulting in the label showing "Agent: Rancher" without "(Adaptive Mode)".
- The checkmark visibility is controlled via CSS `visibility: hidden` (not `display: none`), so the element is always in the DOM — use CSS visibility assertion rather than existence assertion.
- For mock API calls in Playwright, use `page.evaluate()` with `fetch()` after login. The `R_SESS` cookie is the session authentication token; read it via `context.cookies()` before making mock API calls.
- Message IDs are sequential integers starting at 1 per chat session: ID 1 = welcome message, ID 2 = first user message, ID 3 = first assistant response.
