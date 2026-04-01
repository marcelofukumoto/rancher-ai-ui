# MCP Test Plan: Tool Confirmation

**Feature Area:** `tool-confirmation`
**Date Created:** 2026-03-31
**Execution Method:** MCP Playwright (AI agent with Playwright browser automation — no Cypress spec)

## Source Components Analyzed

| Component | Path |
|-----------|------|
| Confirmation dialog | `pkg/rancher-ai-ui/components/message/Confirmation.vue` |
| Message bubble | `pkg/rancher-ai-ui/components/message/index.vue` |
| Chat console | `pkg/rancher-ai-ui/components/panels/Console.vue` |
| Chat page (disabled computed) | `pkg/rancher-ai-ui/pages/Chat.vue` |
| Chat message store | `pkg/rancher-ai-ui/store/chat.ts` |
| Message composable | `pkg/rancher-ai-ui/composables/useChatMessageComposable.ts` |
| Format utilities | `pkg/rancher-ai-ui/utils/format.ts` |
| Message PO | `cypress/e2e/po/message.po.ts` |
| Message spec (patterns) | `cypress/e2e/tests/features/message.spec.ts` |
| i18n labels | `pkg/rancher-ai-ui/l10n/en-us.yaml` |

---

## Prerequisites

- **Application URL:** `https://localhost:8005`
- **Login credentials:** username `admin`, password from `CATTLE_BOOTSTRAP_PASSWORD` (default: `admin`)
- **Self-signed certificate:** Configure Playwright to ignore HTTPS errors (`ignoreHTTPSErrors: true`)
- **LLM mock service (enqueue):** `POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push`
- **LLM mock service (clear):** `POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear`
- **State:** Each test begins with a fresh chat. Clear enqueued mock responses before each test.
- **Note:** The `R_SESS` session cookie is set automatically after login. Use Playwright's request context (which inherits browser cookies) to call mock service endpoints.

---

## Feature Background

When the AI agent executes a tool that modifies cluster resources (e.g., `createKubernetesResource`), the backend emits a `<confirmation-response>...</confirmation-response>` message containing JSON-encoded action details. The frontend parses this into a confirmation dialog embedded in the AI message bubble.

**MessagePhase transitions:**
- During confirmation dialog: `MessagePhase.AwaitingConfirmation`
- This causes `Chat.vue`'s `disabled` computed to return `true`, disabling the console textarea and send button

**Confirmation states:**
- `ConfirmationStatus.Pending` — Confirm and Cancel buttons visible
- `ConfirmationStatus.Confirmed` — Shows "Confirmed" indicator; buttons removed
- `ConfirmationStatus.Canceled` — Shows "Canceled" indicator; buttons removed

---

## Selector Reference

| Selector | Element |
|----------|---------|
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | Chat panel loaded indicator |
| `[data-testid="rancher-ai-ui-chat-input-textarea"]` | Message input textarea |
| `[data-testid="rancher-ai-ui-chat-message-box-1"]` | First message (welcome from AI) |
| `[data-testid="rancher-ai-ui-chat-message-box-2"]` | Second message (user message) |
| `[data-testid="rancher-ai-ui-chat-message-box-3"]` | Third message (AI confirmation request) |
| `[data-testid="rancher-ai-ui-chat-message-box-4"]` | Fourth message (AI confirmation for second resource in multi-resource flow, OR AI result after single-resource confirm) |
| `[data-testid="rancher-ai-ui-chat-message-box-5"]` | Fifth message (AI result after multi-resource sequential confirm) |
| `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` | Confirmation description text |
| `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` | "Confirm" button |
| `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` | "Cancel" button |
| `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` | Confirmed status indicator |
| `[data-testid="rancher-ai-ui-chat-message-confirmation-canceled"]` | Canceled status indicator |
| `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` | Formatted AI text content (scoped inside message box) |
| `.disabled-panel` | CSS class applied to console/send wrapper when `disabled === true` |
| `.send-button` | Send button in console (inside `.chat-input-send`) |

---

## Mock Data Setup

For tests requiring tool confirmation, enqueue the mock **before** sending the user message. The `tool` field causes the mock service to emit a `<confirmation-response>` packet followed by the text response after the user confirms.

### Single-resource mock (createKubernetesResource)

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Content-Type: application/json
Cookie: R_SESS=<session-cookie>

{
  "agent": "rancher",
  "text": {
    "chunks": ["Pod created successfully."]
  },
  "tool": {
    "name": "createKubernetesResource",
    "args": {
      "kind": "Pod",
      "name": "my-pod",
      "cluster": "local",
      "namespace": "default",
      "resource": {
        "apiVersion": "v1",
        "kind": "Pod",
        "metadata": {
          "name": "my-pod",
          "namespace": "default"
        }
      }
    }
  }
}
```

### Multi-resource mock (array of resources)

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Content-Type: application/json
Cookie: R_SESS=<session-cookie>

{
  "agent": "rancher",
  "text": {
    "chunks": ["ConfigMap and Secret created successfully."]
  },
  "tool": {
    "name": "createKubernetesResource",
    "args": [
      {
        "kind": "ConfigMap",
        "name": "my-configmap",
        "cluster": "local",
        "namespace": "default",
        "resource": {
          "apiVersion": "v1",
          "kind": "ConfigMap",
          "metadata": { "name": "my-configmap", "namespace": "default" }
        }
      },
      {
        "kind": "Secret",
        "name": "my-secret",
        "cluster": "local",
        "namespace": "kube-system",
        "resource": {
          "apiVersion": "v1",
          "kind": "Secret",
          "metadata": { "name": "my-secret", "namespace": "kube-system" }
        }
      }
    ]
  }
}
```

### Clear all enqueued responses

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear
Content-Type: application/json
Cookie: R_SESS=<session-cookie>
```

---

## Test Cases

---

### Test 1: Confirmation dialog appears for resource creation

**Description:** Verifies that when the AI agent requests confirmation to create a Kubernetes resource, a confirmation dialog is embedded in the AI message bubble with "Confirm" and "Cancel" buttons.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Single-resource mock enqueued (Pod, name `my-pod`, namespace `default`, cluster `local`)

**Steps:**
1. Navigate to `https://localhost:8005` and log in with username `admin` and the bootstrap password.
2. Open the chat panel (click the AI assistant button in the Rancher header or press `Alt+K`).
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible.
4. Wait for the welcome message: verify `[data-testid="rancher-ai-ui-chat-message-box-1"]` is visible.
5. Enqueue the single-resource mock response via a POST request to the LLM mock service (see Mock Data Setup above).
6. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type `Create a Pod named my-pod in the default namespace`.
7. Press `Enter` to send the message.
8. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear.
9. Within `[data-testid="rancher-ai-ui-chat-message-box-3"]`, wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` to be visible.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` is visible inside message box 3.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` is visible inside message box 3.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` is visible inside message box 3.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` does NOT exist in the DOM.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-canceled"]` does NOT exist in the DOM.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]`

**Screenshot:** `tool-confirmation-mcp-test-1-dialog-appears`

---

### Test 2: Confirmation message shows resource details

**Description:** Verifies that the confirmation message content includes the resource kind, name, namespace, and cluster as specified in the mock tool arguments, along with the confirmation question.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Single-resource mock enqueued (Pod, name `my-pod`, namespace `default`, cluster `local`)
- Continue from Test 1 state OR start a fresh chat with a new enqueued mock

**Message ID sequence:**
- Message 1: AI welcome message
- Message 2: User message ("Create a Pod...")
- Message 3: AI confirmation request (contains resource details)

**Steps:**
1. If starting fresh: log in, open chat, wait for welcome message (message 1), then enqueue the single-resource mock.
2. If continuing from Test 1: the confirmation dialog is already shown in message 3.
3. Otherwise, type `Create a Pod named my-pod in the default namespace` and press `Enter`.
4. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to be visible.
5. Locate `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` inside message box 3.
6. Read the full text content of the confirmation message element.

**Assertions:**
- The text content of `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` contains `Pod`.
- The text content contains `my-pod`.
- The text content contains `default` (namespace reference).
- The text content contains `local` (cluster reference).
- The text content contains `Are you sure you want to proceed with this action?`.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]`

**Screenshot:** `tool-confirmation-mcp-test-2-resource-details`

---

### Test 3: Console is disabled during AwaitingConfirmation phase

**Description:** Verifies that when a confirmation dialog is pending (MessagePhase is `AwaitingConfirmation`), the chat console textarea is disabled and the `.disabled-panel` CSS class is applied to the console wrapper, preventing the user from sending new messages.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Single-resource mock enqueued (Pod, name `my-pod`, namespace `default`, cluster `local`)

**Message ID sequence:**
- Message 1: AI welcome
- Message 2: User message
- Message 3: AI confirmation request (console becomes disabled at this point)

**Steps:**
1. Log in, open chat panel, wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
2. Wait for message 1 (`[data-testid="rancher-ai-ui-chat-message-box-1"]`) to appear.
3. Enqueue the single-resource mock response.
4. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type `Create a Pod named my-pod in the default namespace`.
5. Press `Enter` to send.
6. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear.
7. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` to be visible inside message box 3.
8. Inspect `[data-testid="rancher-ai-ui-chat-input-textarea"]` for its `disabled` attribute.
9. Inspect the chat console wrapper `[data-testid="rancher-ai-ui-chat-console"]` for the presence of `.disabled-panel` class on a child element.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]` has the `disabled` attribute (is not interactable).
- A `.disabled-panel` class-bearing element exists within `[data-testid="rancher-ai-ui-chat-console"]`.
- The send button `.send-button` has the `disabled` attribute or is not clickable.
- The confirmation buttons `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` and `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` remain visible and interactive.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-console"]`
- `.disabled-panel`
- `.send-button`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]`

**Screenshot:** `tool-confirmation-mcp-test-3-console-disabled`

---

### Test 4: Confirm action shows "Confirmed" status and delivers result message

**Description:** Verifies that clicking the "Confirm" button in the confirmation dialog changes the status to "Confirmed", removes the Confirm/Cancel buttons from the DOM, and causes the AI to deliver the follow-up result message.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Single-resource mock enqueued (Pod `my-pod`, text: "Pod created successfully.")

**Message ID sequence:**
- Message 1: AI welcome
- Message 2: User message
- Message 3: AI confirmation request
- Message 4: AI result message ("Pod created successfully.")

**Steps:**
1. Log in, open chat panel, wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
2. Wait for message 1 (`[data-testid="rancher-ai-ui-chat-message-box-1"]`) to appear.
3. Enqueue the single-resource mock (with text chunks: `["Pod created successfully."]`).
4. Type `Create a Pod named my-pod in the default namespace` into `[data-testid="rancher-ai-ui-chat-input-textarea"]` and press `Enter`.
5. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear.
6. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` to be visible.
7. Click `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`.
8. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` to appear.
9. Wait for `[data-testid="rancher-ai-ui-chat-message-box-4"]` to appear.
10. Within message box 4, wait for `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` to be visible.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` is visible inside message box 3.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` does NOT exist in the DOM (removed after confirming).
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` does NOT exist in the DOM (removed after confirming).
- `[data-testid="rancher-ai-ui-chat-message-box-4"]` is visible.
- Within message box 4, `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` contains the text "Pod created successfully."
- The chat console textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is re-enabled (no `disabled` attribute) after the result message is received.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]`
- `[data-testid="rancher-ai-ui-chat-message-box-4"]`
- `[data-testid="rancher-ai-ui-chat-message-formatted-content"]`
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot:** `tool-confirmation-mcp-test-4-confirm-success`

---

### Test 5: Cancel action shows "Canceled" status

**Description:** Verifies that clicking the "Cancel" button changes the status to "Canceled" and removes the Confirm/Cancel buttons from the DOM, without triggering the result message.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Single-resource mock enqueued (Pod `my-pod`, text: "Pod creation canceled.")

**Message ID sequence:**
- Message 1: AI welcome
- Message 2: User message
- Message 3: AI confirmation request (confirmation buttons shown)

**Steps:**
1. Log in, open chat panel, wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
2. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
3. Enqueue the single-resource mock (with text chunks: `["Pod creation canceled."]`).
4. Type `Create a Pod named my-pod in the default namespace` into `[data-testid="rancher-ai-ui-chat-input-textarea"]` and press `Enter`.
5. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear.
6. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` to be visible.
7. Click `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]`.
8. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-canceled"]` to appear.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-canceled"]` is visible inside message box 3.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` does NOT exist in the DOM.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` does NOT exist in the DOM.
- Message box 4 (`[data-testid="rancher-ai-ui-chat-message-box-4"]`) does NOT exist, because the cancel flow does not deliver a new AI message automatically.
- The chat console textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is re-enabled (no `disabled` attribute).

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-canceled"]`
- `[data-testid="rancher-ai-ui-chat-message-box-4"]`
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot:** `tool-confirmation-mcp-test-5-cancel-status`

---

### Test 6: Multi-resource confirmation dialogs appear sequentially

**Description:** Verifies that when the AI agent requests confirmation to create multiple Kubernetes resources (an array of tool arguments), the resources are confirmed **sequentially** — each resource appears in its own confirmation dialog in successive message bubbles. The first confirmation (ConfigMap) appears in message box 3; after clicking Confirm on the first dialog, the second confirmation (Secret) appears in message box 4.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Multi-resource mock enqueued (ConfigMap `my-configmap` in `default` + Secret `my-secret` in `kube-system`)

**Message ID sequence:**
- Message 1: AI welcome
- Message 2: User message
- Message 3: AI confirmation request for first resource (ConfigMap `my-configmap`)
- Message 4: AI confirmation request for second resource (Secret `my-secret`), appears after confirming message 3

**Steps:**
1. Log in, open chat panel, wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
2. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
3. Enqueue the multi-resource mock via POST to the LLM mock service (see Mock Data Setup above).
4. Type `Create a ConfigMap and a Secret` into `[data-testid="rancher-ai-ui-chat-input-textarea"]` and press `Enter`.
5. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear.
6. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` to be visible inside message box 3.
7. Read the text content of the confirmation message in message box 3.
8. Click `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` inside message box 3 to confirm the first resource.
9. Wait for `[data-testid="rancher-ai-ui-chat-message-box-4"]` to appear.
10. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` to be visible inside message box 4.
11. Read the text content of the confirmation message in message box 4.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` inside message box 3 contains `ConfigMap` and `my-configmap`.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` inside message box 3 contains `Are you sure you want to proceed with this action?`.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` is visible inside message box 3 before clicking.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` is visible inside message box 3 before clicking.
- After clicking Confirm on message box 3, `[data-testid="rancher-ai-ui-chat-message-box-4"]` appears.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` inside message box 4 contains `Secret` and `my-secret`.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]` inside message box 4 contains `Are you sure you want to proceed with this action?`.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` is visible inside message box 4.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` is visible inside message box 4.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-chat-message-box-4"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-message"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]`

**Screenshot:** `tool-confirmation-mcp-test-6-multi-resource`

---

### Test 7: Confirm multi-resource action delivers result message

**Description:** Verifies that confirming all sequential multi-resource confirmation dialogs (two Confirm clicks — one per resource) results in each dialog showing "Confirmed" status and the follow-up result text message being delivered in message box 5.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- Multi-resource mock enqueued (ConfigMap + Secret, text: "ConfigMap and Secret created successfully.")

**Message ID sequence:**
- Message 1: AI welcome
- Message 2: User message
- Message 3: AI confirmation request for first resource (ConfigMap `my-configmap`)
- Message 4: AI confirmation request for second resource (Secret `my-secret`), appears after confirming message 3
- Message 5: AI result message ("ConfigMap and Secret created successfully."), appears after confirming message 4

**Steps:**
1. Log in, open chat panel, wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
2. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
3. Enqueue the multi-resource mock (text: `["ConfigMap and Secret created successfully."]`).
4. Type `Create a ConfigMap and a Secret` into `[data-testid="rancher-ai-ui-chat-input-textarea"]` and press `Enter`.
5. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear.
6. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` to be visible inside message box 3.
7. Click `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` inside message box 3 (confirms ConfigMap).
8. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` to appear inside message box 3.
9. Wait for `[data-testid="rancher-ai-ui-chat-message-box-4"]` to appear.
10. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` to be visible inside message box 4.
11. Click `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` inside message box 4 (confirms Secret).
12. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` to appear inside message box 4.
13. Wait for `[data-testid="rancher-ai-ui-chat-message-box-5"]` to appear.
14. Within message box 5, wait for `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` to be visible.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` is visible inside message box 3.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` is visible inside message box 4.
- `[data-testid="rancher-ai-ui-chat-message-box-5"]` is visible.
- Within message box 5, `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` contains "ConfigMap and Secret created successfully."
- The chat console textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is re-enabled (no `disabled` attribute) after the result message is received.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`
- `[data-testid="rancher-ai-ui-chat-message-box-4"]`
- `[data-testid="rancher-ai-ui-chat-message-box-5"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]`
- `[data-testid="rancher-ai-ui-chat-message-formatted-content"]`
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot:** `tool-confirmation-mcp-test-7-multi-resource-confirm`

---

### Test 8: New chat can be started after completing a confirmation flow

**Description:** Verifies that after a tool confirmation flow completes (either confirmed or canceled), the user can start a new chat session normally and the confirmation state does not persist.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open
- Single-resource mock enqueued (Pod `my-pod`)
- A prior confirmation flow is completed (e.g., user has clicked Confirm or Cancel)

**Message ID sequence (first chat):**
- Message 1: AI welcome
- Message 2: User message
- Message 3: AI confirmation (confirmed)
- Message 4: AI result

**Message ID sequence (new chat after resetting):**
- Message 1: New chat welcome message

**Steps:**
1. Log in, open chat panel, wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
2. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
3. Enqueue the single-resource mock (text: `["Pod created successfully."]`).
4. Type `Create a Pod named my-pod in the default namespace` and press `Enter`.
5. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` and `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` to be visible.
6. Click `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`.
7. Wait for `[data-testid="rancher-ai-ui-chat-message-confirmation-confirmed"]` to appear in message 3.
8. Wait for `[data-testid="rancher-ai-ui-chat-message-box-4"]` to appear and contain the result text.
9. Press `Ctrl+Shift+O` to start a new chat (keyboard shortcut for "New Chat").
10. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to still be visible.
11. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to be visible (new welcome message).

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-1"]` is visible (new welcome message loaded).
- `[data-testid="rancher-ai-ui-chat-message-box-2"]` does NOT exist (no prior messages from old session).
- `[data-testid="rancher-ai-ui-chat-input-textarea"]` is visible and enabled (no `disabled` attribute).
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]` does NOT exist in the DOM.
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]` does NOT exist in the DOM.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`
- `[data-testid="rancher-ai-ui-chat-message-box-1"]`
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-message-confirmation-cancel-button"]`

**Screenshot:** `tool-confirmation-mcp-test-8-new-chat-after-confirm`

---

## Implementation Notes

- The `disabled` computed in `Chat.vue` (line ~149) returns `true` for `MessagePhase.AwaitingConfirmation`, `systemErrors`, and non-Active service state. It does **NOT** include `MessagePhase.GeneratingResponse` — the console stays active during streaming.
- The confirmation dialog uses `v-if` on `props.value.status === ConfirmationStatus.Pending` to show/hide buttons — so buttons are fully removed from the DOM (not just hidden) after confirm or cancel.
- Message IDs are sequential from 1, incremented per message. The welcome AI message is always ID 1 in a fresh chat.
- The `tool.args` field can be either a plain object (single resource) or an array of objects (multiple resources). Both trigger the confirmation dialog.
- When `tool.args` is an array, each resource is confirmed **sequentially**: the first resource appears as a confirmation dialog in message box 3; after the user clicks Confirm, the second resource appears in message box 4, and so on. The final AI result text message appears only after all resources in the sequence have been confirmed.
- After confirming or canceling, the mock service delivers the `text.chunks` content as the next AI message.
- The session cookie (`R_SESS`) must be passed when making requests to the LLM mock service proxy URL.
