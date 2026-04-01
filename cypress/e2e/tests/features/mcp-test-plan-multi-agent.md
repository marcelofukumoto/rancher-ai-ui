# MCP Test Plan: Multi-Agent Selection

**Feature Area**: `multi-agent`
**Date Created**: 2026-04-01
**Plan Type**: Initial
**Execution Method**: MCP Playwright (not Cypress)

## Source Components Analyzed

- `pkg/rancher-ai-ui/components/agent/SelectAgent.vue`
- `pkg/rancher-ai-ui/components/panels/Console.vue` (v-if condition for SelectAgent)
- `pkg/rancher-ai-ui/components/message/index.vue` (agent label on messages)
- `pkg/rancher-ai-ui/composables/useAgentComposable.ts`
- `pkg/rancher-ai-ui/l10n/en-us.yaml` (i18n strings)
- `cypress/e2e/po/console.po.ts`
- `cypress/e2e/blueprints/aiAgentConfigs.ts`

---

## Prerequisites

- **Application URL**: `https://localhost:8005`
- **Credentials**: username `admin`, password from `CATTLE_BOOTSTRAP_PASSWORD`
- **Self-signed certificate**: Configure Playwright to ignore HTTPS errors (`ignoreHTTPSErrors: true`)
- **LLM mock service**: `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy`
- **Test environment**: The default Rancher agent (`name: rancher`, `displayName: Rancher`) is assumed to exist and be active in the test environment

---

## Global Setup Notes

### Creating a Second Agent (Harvester) for Multi-Agent Tests

Tests 2–9 require **two active agents**. Before running these tests, create the Harvester agent config via the Rancher API:

**HTTP Method**: POST  
**URL**: `https://localhost:8005/v1/ai.cattle.io.aiagentconfig`  
**Headers**:
- `Content-Type: application/json`
- `x-api-csrf: <value from CSRF cookie>`

**Body**:
```json
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
    "toolSet": "harvester"
  }
}
```

To get the CSRF token: read the `CSRF` cookie from `https://localhost:8005` and include it as the `x-api-csrf` header value.

### Deleting the Second Agent After Tests

To clean up, send:  
**HTTP Method**: DELETE  
**URL**: `https://localhost:8005/v1/ai.cattle.io.aiagentconfig/cattle-ai-agent-system/harvester`  
**Headers**: `x-api-csrf: <CSRF cookie value>`

---

## Test Cases

---

### Test 1: Agent Selector Hidden in Single-Agent Mode

**Description**: Verifies that the multi-agent selector dropdown is not rendered in the DOM when only one agent is active.

**Preconditions**:
- Default Rancher agent only (no Harvester agent configured)
- If Harvester agent exists from a prior test run, delete it via the DELETE API above

**Steps**:
1. Navigate to `https://localhost:8005`
2. Log in with username `admin` and the bootstrap password
3. Wait for the Rancher home page to load
4. Click the AI assistant button in the Rancher header (or press `Alt+K`) to open the chat panel
5. Wait for the element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (up to 30 seconds)
6. Take a screenshot named `multi-agent-mcp-test-1-single-agent-no-selector`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select"]` does **NOT** exist in the DOM

**Selectors**:
- `[data-testid="rancher-ai-ui-multi-agent-select"]`

---

### Test 2: Agent Selector Visible in Multi-Agent Mode

**Description**: Verifies that the multi-agent selector appears and shows "Adaptive Agent Selection" as the default when two or more agents are active.

**Preconditions**:
- Create the Harvester agent config via the API (see Global Setup Notes above)
- Wait approximately 2 seconds for the agent config to register in the system
- Log in to Rancher

**Steps**:
1. Navigate to `https://localhost:8005`
2. Log in with username `admin` and the bootstrap password
3. Wait for the Rancher home page to load
4. Click the AI assistant button in the Rancher header (or press `Alt+K`) to open the chat panel
5. Wait for the element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (up to 30 seconds)
6. Take a screenshot named `multi-agent-mcp-test-2-selector-visible`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select"]` exists in the DOM
- The element `.selected-agent-name` inside `[data-testid="rancher-ai-ui-multi-agent-select"]` contains the text `Adaptive Agent Selection`

**Selectors**:
- `[data-testid="rancher-ai-ui-multi-agent-select"]`
- `[data-testid="rancher-ai-ui-multi-agent-select"] .selected-agent-name`

---

### Test 3: Dropdown Lists All Agents and Adaptive Option

**Description**: Verifies that clicking the agent selector dropdown shows the "Adaptive Agent Selection" option plus all configured agent entries.

**Preconditions**:
- Harvester agent is configured and active (from Test 2 setup or Global Setup)
- Chat panel is open and ready

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Click the element `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown
4. Wait approximately 500 milliseconds for the dropdown animation to complete
5. Take a screenshot named `multi-agent-mcp-test-3-dropdown-open`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` is visible and contains the text `Adaptive Agent Selection`
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` is visible and contains the text `Rancher`
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-harvester"]` is visible and contains the text `Harvester`

**Selectors**:
- `[data-testid="rancher-ai-ui-multi-agent-select"]`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-harvester"]`

---

### Test 4: Selecting a Specific Agent Updates the Trigger Label

**Description**: Verifies that clicking a specific agent in the dropdown updates the trigger button to display that agent's name.

**Preconditions**:
- Harvester agent configured and active
- Chat panel open and ready
- Agent selector is in "Adaptive Agent Selection" mode (default)

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Verify the selector trigger shows `Adaptive Agent Selection` in `.selected-agent-name`
4. Click the element `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown
5. Wait approximately 500 milliseconds
6. Click the element `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]`
7. Wait approximately 500 milliseconds for the debounced selection (100ms debounce)
8. Take a screenshot named `multi-agent-mcp-test-4-rancher-selected`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select"] .selected-agent-name` contains the text `Rancher`
- The element `[data-testid="rancher-ai-ui-multi-agent-select"] .selected-agent-name` does **NOT** contain the text `Adaptive Agent Selection`

**Selectors**:
- `[data-testid="rancher-ai-ui-multi-agent-select"]`
- `[data-testid="rancher-ai-ui-multi-agent-select"] .selected-agent-name`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]`

---

### Test 5: Checkmark Indicator Reflects Selected Agent

**Description**: Verifies that the checkmark icon (`.icon-checkmark`) is visible on the currently selected agent and hidden (CSS `visibility: hidden`) on unselected agents, when the dropdown is open.

**Preconditions**:
- Harvester agent configured and active
- Chat panel open and ready
- Rancher agent is selected manually (from Test 4)

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Open the dropdown: click `[data-testid="rancher-ai-ui-multi-agent-select"]`
4. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` to select Rancher
5. Wait approximately 500 milliseconds
6. Open the dropdown again: click `[data-testid="rancher-ai-ui-multi-agent-select"]`
7. Wait approximately 500 milliseconds
8. Take a screenshot named `multi-agent-mcp-test-5-checkmark-indicator`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"] .icon-checkmark` does **NOT** have the CSS class `hidden` (it is visible/selected)
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-harvester"] .icon-checkmark` has the CSS class `hidden` (it is not selected)
- The element `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"] .icon-checkmark` has the CSS class `hidden` (it is not selected)

**Selectors**:
- `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"] .icon-checkmark`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-harvester"] .icon-checkmark`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"] .icon-checkmark`

---

### Test 6: Switch Back to Adaptive Agent Selection Mode

**Description**: Verifies that selecting the "Adaptive Agent Selection" option from the dropdown restores the trigger label and resets agent selection to adaptive mode.

**Preconditions**:
- Harvester agent configured and active
- Chat panel open and ready
- Rancher agent is currently selected manually (trigger shows "Rancher")

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Click `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the dropdown
4. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` to select Rancher
5. Wait approximately 500 milliseconds
6. Verify `.selected-agent-name` shows `Rancher`
7. Click `[data-testid="rancher-ai-ui-multi-agent-select"]` again to open the dropdown
8. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]` to switch back to adaptive mode
9. Wait approximately 500 milliseconds for the debounced selection
10. Take a screenshot named `multi-agent-mcp-test-6-adaptive-mode-restored`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-multi-agent-select"] .selected-agent-name` contains the text `Adaptive Agent Selection`

**Selectors**:
- `[data-testid="rancher-ai-ui-multi-agent-select"] .selected-agent-name`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-__adaptive__"]`
- `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]`

---

### Test 7: Response Message Shows Agent Label in Adaptive Mode

**Description**: Verifies that an AI response message displays the agent label including "(Adaptive Mode)" when the selector is in adaptive mode and the agent is auto-selected.

**Preconditions**:
- Harvester agent configured and active
- Chat panel open and in adaptive mode (default, trigger shows "Adaptive Agent Selection")
- Enqueue mock LLM response before sending the message (see Mock Data Setup below)

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Wait for the welcome message to complete: wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to be visible
4. Enqueue the mock LLM response via POST (see Mock Data Setup — Test 7)
5. Click the element `[data-testid="rancher-ai-ui-chat-input-textarea"]` to focus it
6. Type the message `What agents are available?`
7. Press Enter to send the message
8. Wait for the user message `[data-testid="rancher-ai-ui-chat-message-box-2"]` to be visible
9. Wait for the AI response `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear and complete (wait up to 15 seconds for streaming to finish)
10. Take a screenshot named `multi-agent-mcp-test-7-adaptive-mode-agent-label`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-chat-message-box-3"]` contains the element `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]`
- The text content of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` contains `Rancher`
- The text content of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` contains `(Adaptive Mode)`

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]`

---

### Test 8: Response Message Shows Agent Label Without "(Adaptive Mode)" in Manual Mode

**Description**: Verifies that when the agent is selected manually, the response message shows the agent name without "(Adaptive Mode)".

**Preconditions**:
- Harvester agent configured and active
- Chat panel open and ready
- Agent selector is switched to "Rancher" manually (trigger shows "Rancher")
- Enqueue mock LLM response before sending the message (see Mock Data Setup — Test 8)

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Wait for the welcome message `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear and complete
4. Click `[data-testid="rancher-ai-ui-multi-agent-select"]` to open the agent dropdown
5. Click `[data-testid="rancher-ai-ui-multi-agent-select-option-rancher"]` to select Rancher manually
6. Wait approximately 500 milliseconds
7. Enqueue the mock LLM response via POST (see Mock Data Setup — Test 8)
8. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` to focus it
9. Type the message `Tell me about deployments`
10. Press Enter to send the message
11. Wait for the user message `[data-testid="rancher-ai-ui-chat-message-box-2"]` to be visible
12. Wait for the AI response `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear and complete (up to 15 seconds)
13. Take a screenshot named `multi-agent-mcp-test-8-manual-mode-agent-label`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-chat-message-box-3"]` contains the element `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]`
- The text content of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` contains `Rancher`
- The text content of `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]` does **NOT** contain `(Adaptive Mode)`

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]`

---

### Test 9: Agent Label Absent on User Messages and Absent When No Agent Metadata

**Description**: Verifies that the agent label is only shown on assistant (AI) messages — not on user-submitted messages — since the label is gated by `v-if="props.message.role === RoleEnum.Assistant && props.message.agentMetadata?.agent"`.

**Preconditions**:
- Harvester agent configured and active
- Chat panel open, adaptive mode active
- Enqueue a mock LLM response before sending

**Steps**:
1. Navigate to `https://localhost:8005`, log in, and open the chat panel
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
3. Wait for welcome message `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear and complete
4. Enqueue the mock LLM response via POST (see Mock Data Setup — Test 9)
5. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type `Hello agent`
6. Press Enter to send
7. Wait for user message `[data-testid="rancher-ai-ui-chat-message-box-2"]` to appear
8. Wait for AI response `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear and complete (up to 15 seconds)
9. Take a screenshot named `multi-agent-mcp-test-9-agent-label-on-assistant-only`

**Assertions**:
- The element `[data-testid="rancher-ai-ui-chat-message-box-2"]` (user message) does **NOT** contain any element matching `[data-testid^="rancher-ai-ui-chat-message-selected-agent-label-"]`
- The element `[data-testid="rancher-ai-ui-chat-message-box-3"]` (assistant message) **DOES** contain an element matching `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]`

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid^="rancher-ai-ui-chat-message-selected-agent-label-"]`
- `[data-testid="rancher-ai-ui-chat-message-selected-agent-label-rancher"]`

---

## Mock Data Setup

### Mock Push Endpoint

All mock responses are enqueued via:

**HTTP Method**: POST  
**URL**: `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push`  
**Headers**:
- `Content-Type: application/json`
- `Cookie: R_SESS=<session cookie value>`

> **Important**: Use `POST` (not PUT) for the push endpoint.

---

### Test 7 — Mock Response (Adaptive Mode)

When `agent` is set to a string value (e.g., `"rancher"`), the mock service simulates the adaptive mode auto-selecting that agent:

```json
{
  "agent": "rancher",
  "text": {
    "chunks": [
      "There are currently two agents available: ",
      "Rancher and Harvester."
    ]
  }
}
```

---

### Test 8 — Mock Response (Manual Mode)

When `agent` is `null`, the mock service simulates manual mode where no adaptive routing occurs:

```json
{
  "agent": null,
  "text": {
    "chunks": [
      "Here is information about your deployments."
    ]
  }
}
```

---

### Test 9 — Mock Response (Adaptive Mode)

```json
{
  "agent": "rancher",
  "text": {
    "chunks": [
      "Hello! How can I help you today?"
    ]
  }
}
```

---

## Implementation Notes

- `rancher-ai-ui-multi-agent-select` is rendered via `v-if="props.agents.length > 1"` in `Console.vue` — it is completely absent from the DOM when only one agent is configured
- The "Adaptive Agent Selection" option (`option-__adaptive__`) is only rendered inside the dropdown when `activeAgentNames.length > 1`
- The `.icon-checkmark` element uses CSS class `hidden` (not `display: none`) to hide the checkmark — use class assertion, not visibility assertion
- Agent selection uses a 100ms debounce (`debouncedSelectAgent`) — wait at least 200ms after clicking an option before asserting the trigger label
- The `agent` field in mock body:
  - `"rancher"` (string) → adaptive mode, rancher was auto-selected
  - `null` → manual mode, no adaptive routing
  - Omit `agent` field entirely when there is only 1 active agent (not applicable for multi-agent tests)
- Message IDs: welcome message = ID 1, user message = ID 2, AI response = ID 3 (assumes `cleanChatHistory()` was called or this is a fresh chat)
- Agent label selector format: `rancher-ai-ui-chat-message-selected-agent-label-{agentName}` where `agentName` is the CRD `metadata.name` value (e.g., `rancher`, `harvester`)
- i18n text `ai.agents.selectionMode.auto` = `(Adaptive Mode)` — this is appended to the display name in the label
- i18n text `ai.agents.items.default.displayName` = `Adaptive Agent Selection` — shown as trigger label in adaptive mode
