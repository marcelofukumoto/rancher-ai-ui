# MCP Test Plan: Console Feature

**Feature Area:** console  
**Date Created:** 2026-03-31  
**Execution Method:** MCP Playwright (AI agent executes steps via Playwright browser automation)

## Source Components Analyzed

- `pkg/rancher-ai-ui/components/panels/Console.vue` — main chat input panel
- `pkg/rancher-ai-ui/components/console/LlmModelLabel.vue` — LLM model info label
- `pkg/rancher-ai-ui/components/console/VerifyResultsDisclaimer.vue` — disclaimer popover
- `pkg/rancher-ai-ui/composables/useInputComposable.ts` — input state management
- `cypress/e2e/po/console.po.ts` — confirmed selectors

---

## Prerequisites

| Item | Value |
|------|-------|
| Application URL | `https://localhost:8005` |
| Username | `admin` |
| Password | `password` |
| Self-signed certificate | Playwright must be configured to ignore HTTPS errors (`ignoreHTTPSErrors: true`) |
| LLM mock service | `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy` |

### Mock Service Setup

To enqueue a mock LLM response, send a POST request **before** opening the chat panel or sending a user message:

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Cookie: R_SESS=<session-cookie>
Content-Type: application/json

{
  "agent": "rancher",
  "text": {
    "chunks": ["<response chunk 1>", "<response chunk 2>", ...]
  }
}
```

> Obtain the `R_SESS` cookie value after login from the browser cookies for `https://localhost:8005`.

To clear all enqueued responses:
```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear
Cookie: R_SESS=<session-cookie>
Content-Type: application/json
```

---

## Known Selectors

| Selector | Element |
|----------|---------|
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | Panel loaded indicator |
| `[data-testid="rancher-ai-ui-chat-container"]` | Chat panel root |
| `[data-testid="rancher-ai-ui-chat-input-textarea"]` | Message input textarea |
| `[data-testid="rancher-ai-ui-chat-console"]` | Console area root |
| `[data-testid="rancher-ai-ui-chat-message-box-{N}"]` | Message box by ID |
| `.chat-input-complete .text` | Ghost text overlay (prompt history / tab autocomplete preview) |
| `.tab-label-box` | "Tab" key hint label shown with autocomplete |
| `.send-button` | Send button inside console |
| `.disabled-panel` | Class applied to input wrapper and send area when AI is processing |
| `.llm-model-label` | LLM model name label in console info bar |
| `.disclaimer` | Verify results disclaimer popover content |
| `.disclaimer-section-title` | Section title inside disclaimer popover |

---

## Message ID Sequence

Message IDs are assigned sequentially starting at 1, in the order messages arrive:
- **ID 1**: AI welcome message (always sent first when panel opens)
- **ID 2**: First user message
- **ID 3**: AI response to first user message
- **ID 4**: Second user message (if applicable)
- **ID 5**: AI response to second user message (if applicable)

---

## Test Cases

---

### Test 1: Send a message using the Enter key

**Description:** Verifies that typing a message and pressing Enter sends the message and displays both the user message and the AI response in the chat.

**Preconditions:**
- Enqueue a mock LLM response (see Mock Data Setup — Test 1)

**Steps:**
1. Navigate to `https://localhost:8005` (ignore HTTPS certificate errors).
2. Log in with username `admin` and password `password`.
3. Obtain the `R_SESS` session cookie value from browser cookies.
4. Send a POST request to the mock service to enqueue two responses (welcome + user reply):
   - First enqueue: `{ "agent": "rancher", "text": { "chunks": ["Hello! I am Liz, your AI assistant."] } }`
   - Second enqueue: `{ "agent": "rancher", "text": { "chunks": ["Here is my response to your question."] } }`
5. Click the AI assistant button in the Rancher header to open the chat panel.
6. Wait for the element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (timeout: 15 seconds).
7. Wait for the element `[data-testid="rancher-ai-ui-chat-message-box-1"]` to be visible, confirming the welcome message arrived.
8. Click on the element `[data-testid="rancher-ai-ui-chat-input-textarea"]` to focus it.
9. Type the text `What is Rancher?` into the textarea.
10. Press the `Enter` key.
11. Wait for the element `[data-testid="rancher-ai-ui-chat-message-box-2"]` to be visible (timeout: 10 seconds).
12. Wait for the element `[data-testid="rancher-ai-ui-chat-message-box-3"]` to be visible (timeout: 15 seconds).
13. Take a screenshot named `console-mcp-test-1-send-via-enter`.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-2"]` contains the text `What is Rancher?`
- `[data-testid="rancher-ai-ui-chat-message-box-3"]` contains the text `Here is my response to your question.`
- The textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is empty after sending

**Selectors:** `rancher-ai-ui-chat-panel-ready`, `rancher-ai-ui-chat-input-textarea`, `rancher-ai-ui-chat-message-box-2`, `rancher-ai-ui-chat-message-box-3`

---

### Test 2: Send a message using the Send button (click)

**Description:** Verifies that clicking the send button submits the user message.

**Preconditions:**
- Enqueue mock LLM responses (welcome + reply)

**Steps:**
1. Navigate to `https://localhost:8005` and log in with `admin` / `password`.
2. Obtain the `R_SESS` cookie from browser cookies.
3. Enqueue two mock responses:
   - Welcome: `{ "agent": "rancher", "text": { "chunks": ["Welcome! I am here to help."] } }`
   - Reply: `{ "agent": "rancher", "text": { "chunks": ["Rancher is a Kubernetes management platform."] } }`
4. Click the AI assistant button in the Rancher header.
5. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (timeout: 15 seconds).
6. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
7. Click on `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type `Tell me about Rancher`.
8. Click the `.send-button` element inside `[data-testid="rancher-ai-ui-chat-console"]`.
9. Wait for `[data-testid="rancher-ai-ui-chat-message-box-2"]` to be visible (timeout: 10 seconds).
10. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to be visible (timeout: 15 seconds).
11. Take a screenshot named `console-mcp-test-2-send-via-button`.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-2"]` contains the text `Tell me about Rancher`
- `[data-testid="rancher-ai-ui-chat-message-box-3"]` contains text `Rancher is a Kubernetes management platform.`
- The textarea is empty after sending

**Selectors:** `rancher-ai-ui-chat-input-textarea`, `.send-button`, `rancher-ai-ui-chat-message-box-2`, `rancher-ai-ui-chat-message-box-3`

---

### Test 3: Shift+Enter creates a newline instead of sending

**Description:** Verifies that pressing Shift+Enter adds a newline to the input rather than sending the message.

**Preconditions:**
- Chat panel must be open and ready (no mock response needed for this test)

**Steps:**
1. Navigate to `https://localhost:8005` and log in with `admin` / `password`.
2. Obtain the `R_SESS` cookie from browser cookies.
3. Enqueue a welcome mock response: `{ "agent": "rancher", "text": { "chunks": ["Hello, how can I help you?"] } }`
4. Click the AI assistant button in the Rancher header.
5. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (timeout: 15 seconds).
6. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
7. Click on `[data-testid="rancher-ai-ui-chat-input-textarea"]`.
8. Type the text `Line one`.
9. Press `Shift+Enter` (hold Shift, then press Enter).
10. Type the text `Line two`.
11. Verify the textarea still has focus and contains multiline text (no message was sent yet).
12. Take a screenshot named `console-mcp-test-3-shift-enter-newline`.
13. Verify no element `[data-testid="rancher-ai-ui-chat-message-box-2"]` exists yet (no new message sent).

**Assertions:**
- The element `[data-testid="rancher-ai-ui-chat-input-textarea"]` still has content (not empty)
- No element `[data-testid="rancher-ai-ui-chat-message-box-2"]` exists in the DOM
- The textarea value contains a newline character between `Line one` and `Line two`

**Selectors:** `rancher-ai-ui-chat-input-textarea`

---

### Test 4: Prompt history recall with ArrowUp

**Description:** Verifies that pressing ArrowUp in the empty textarea populates the ghost text overlay (`.chat-input-complete .text`) with the most recent user message text, without changing the textarea value itself.

**Preconditions:**
- At least one user message must have been sent in this session

**Steps:**
1. Navigate to `https://localhost:8005` and log in with `admin` / `password`.
2. Obtain the `R_SESS` cookie.
3. Enqueue two mock responses:
   - Welcome: `{ "agent": "rancher", "text": { "chunks": ["Welcome!"] } }`
   - Reply: `{ "agent": "rancher", "text": { "chunks": ["Sure, here is info about deployments."] } }`
4. Click the AI assistant button in the Rancher header.
5. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (timeout: 15 seconds).
6. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
7. Click on `[data-testid="rancher-ai-ui-chat-input-textarea"]`.
8. Type `Explain Kubernetes deployments` and press Enter.
9. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear (AI response received, timeout: 15 seconds).
10. Verify the textarea is now empty (after sending, it was cleared).
11. Press the `ArrowUp` key while the textarea is focused.
12. Wait 300ms for the ghost text overlay to render.
13. Take a screenshot named `console-mcp-test-4-arrow-up-history`.

**Assertions:**
- The element `.chat-input-complete .text` is visible and contains the text `Explain Kubernetes deployments`
- The element `.tab-label-box` is visible (Tab hint shows alongside ghost text)
- The textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` value is still empty (ghost text is the overlay, not the textarea value)

**Selectors:** `rancher-ai-ui-chat-input-textarea`, `.chat-input-complete .text`, `.tab-label-box`

---

### Test 5: Prompt history navigation with ArrowDown clears the overlay

**Description:** Verifies that pressing ArrowDown after ArrowUp clears the ghost text overlay and returns to an empty state.

**Preconditions:**
- At least one user message must have been sent; ghost text overlay is currently visible from ArrowUp

**Steps:**
1. Complete steps 1–12 from Test 4 to reach the state where `.chat-input-complete .text` is visible.
2. Verify that `.chat-input-complete .text` is visible with text `Explain Kubernetes deployments`.
3. While the textarea is focused, press the `ArrowDown` key.
4. Wait 300ms.
5. Take a screenshot named `console-mcp-test-5-arrow-down-clear`.

**Assertions:**
- The element `.chat-input-complete .text` is no longer visible (overlay is hidden)
- The textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is still empty
- The placeholder text is visible in the textarea (no ghost text, no content)

**Selectors:** `rancher-ai-ui-chat-input-textarea`, `.chat-input-complete .text`

---

### Test 6: Tab key accepts the autocomplete suggestion

**Description:** Verifies that when ghost text is shown via ArrowUp, pressing Tab fills the textarea with the suggested text.

**Preconditions:**
- At least one user message sent; ghost text overlay visible (`.chat-input-complete .text`)

**Steps:**
1. Complete steps 1–12 from Test 4 to reach the state where `.chat-input-complete .text` is visible with text `Explain Kubernetes deployments`.
2. Verify `.chat-input-complete .text` contains `Explain Kubernetes deployments`.
3. With the textarea focused, press the `Tab` key. (If Playwright requires forcing key dispatch on a textarea, use `page.keyboard.press('Tab')` to dispatch the key event directly while the textarea is focused.)
4. Wait 300ms for the state to update.
5. Take a screenshot named `console-mcp-test-6-tab-autocomplete`.

**Assertions:**
- The textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` now contains the text `Explain Kubernetes deployments`
- The element `.chat-input-complete .text` is no longer visible (suggestion accepted, overlay removed)

**Selectors:** `rancher-ai-ui-chat-input-textarea`, `.chat-input-complete .text`

---

### Test 7: Console is disabled while the AI is processing a response

**Description:** Verifies that the console input and send button are visually disabled while the AI is processing a streaming response, and re-enabled once the response completes.

**Preconditions:**
- Use a mock response with many small chunks to create a long streaming window

**Steps:**
1. Navigate to `https://localhost:8005` and log in with `admin` / `password`.
2. Obtain the `R_SESS` cookie.
3. Enqueue a welcome response: `{ "agent": "rancher", "text": { "chunks": ["Welcome to Rancher AI!"] } }`
4. Enqueue a slow streaming reply with many single-character chunks so the processing window is wide enough to capture (use a long text split into 1-character chunks). For example, split the string `"This is a long streaming response from the AI assistant that verifies the disabled state of the console while the model is generating text."` into individual characters, each as its own chunk.
5. Click the AI assistant button in the Rancher header.
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` (timeout: 15 seconds).
7. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
8. Click on `[data-testid="rancher-ai-ui-chat-input-textarea"]`.
9. Type `Give me a long response` and press Enter.
10. Immediately (within ~500ms) check that `.disabled-panel` class is present on the element inside `[data-testid="rancher-ai-ui-chat-console"]`.
11. Take a screenshot named `console-mcp-test-7-disabled-during-processing`.
12. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to be visible and for the AI message to appear completed (timeout: 30 seconds).
13. Take a screenshot named `console-mcp-test-7-enabled-after-processing`.

**Assertions (during processing):**
- The element `[data-testid="rancher-ai-ui-chat-console"]` contains a child with class `disabled-panel`
- The textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` has the `disabled` attribute

**Assertions (after processing):**
- No `.disabled-panel` class is present on the console children
- The textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` does NOT have the `disabled` attribute

**Selectors:** `rancher-ai-ui-chat-console`, `rancher-ai-ui-chat-input-textarea`, `.disabled-panel`

---

### Test 8: LLM model label is visible in the console info bar

**Description:** Verifies that the LLM model label is displayed below the input area, showing the configured model name or a fallback text.

**Preconditions:**
- Chat panel must be open and ready

**Steps:**
1. Navigate to `https://localhost:8005` and log in with `admin` / `password`.
2. Obtain the `R_SESS` cookie.
3. Enqueue a welcome response: `{ "agent": "rancher", "text": { "chunks": ["Hi there!"] } }`
4. Click the AI assistant button in the Rancher header.
5. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` (timeout: 15 seconds).
6. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
7. Locate the element `.llm-model-label` inside `[data-testid="rancher-ai-ui-chat-console"]`.
8. Take a screenshot named `console-mcp-test-8-llm-model-label`.

**Assertions:**
- The element `.llm-model-label` exists and is visible
- The element `.llm-model-label` has non-empty text content (either a configured model name or the fallback "Unknown model" text)

**Selectors:** `.llm-model-label`

---

### Test 9: Verify results disclaimer popover opens and shows content

**Description:** Verifies that clicking the "Verify results" disclaimer link opens a popover with disclamer sections about AI limitations.

**Preconditions:**
- Chat panel must be open and ready

**Steps:**
1. Navigate to `https://localhost:8005` and log in with `admin` / `password`.
2. Obtain the `R_SESS` cookie.
3. Enqueue a welcome response: `{ "agent": "rancher", "text": { "chunks": ["Hello!"] } }`
4. Click the AI assistant button in the Rancher header.
5. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` (timeout: 15 seconds).
6. Wait for `[data-testid="rancher-ai-ui-chat-message-box-1"]` to appear.
7. Locate the disclaimer trigger link inside `[data-testid="rancher-ai-ui-chat-console"]` (look for text matching "Verify results" or an anchor/button near the `.llm-model-label`).
8. Click the disclaimer trigger element.
9. Wait 500ms for the popover animation to complete.
10. Take a screenshot named `console-mcp-test-9-disclaimer-popover`.

**Assertions:**
- The element `.disclaimer` is visible after clicking the trigger
- The element `.disclaimer` contains at least one `.disclaimer-section-title` child element
- The popover content has non-empty text

**Selectors:** `.disclaimer`, `.disclaimer-section-title`

---

## Mock Data Setup Summary

| Test | Mock Response Details |
|------|-----------------------|
| Test 1 | Welcome: `["Hello! I am Liz, your AI assistant."]` · Reply: `["Here is my response to your question."]` |
| Test 2 | Welcome: `["Welcome! I am here to help."]` · Reply: `["Rancher is a Kubernetes management platform."]` |
| Test 3 | Welcome: `["Hello, how can I help you?"]` |
| Test 4 | Welcome: `["Welcome!"]` · Reply: `["Sure, here is info about deployments."]` |
| Test 5 | Same as Test 4 |
| Test 6 | Same as Test 4 |
| Test 7 | Welcome: `["Welcome to Rancher AI!"]` · Slow reply: long string split into 1-char chunks |
| Test 8 | Welcome: `["Hi there!"]` |
| Test 9 | Welcome: `["Hello!"]` |

### Test 7 — Slow Response Chunk Construction

Split the following string into individual single-character chunks:

```
"This is a long streaming response from the AI assistant that verifies the disabled state of the console while the model is generating text."
```

The resulting JSON payload for Test 7's reply:

```json
{
  "agent": "rancher",
  "text": {
    "chunks": ["T","h","i","s"," ","i","s"," ","a"," ","l","o","n","g"," ","s","t","r","e","a","m","i","n","g"," ","r","e","s","p","o","n","s","e"," ","f","r","o","m"," ","t","h","e"," ","A","I"," ","a","s","s","i","s","t","a","n","t"," ","t","h","a","t"," ","v","e","r","i","f","i","e","s"," ","t","h","e"," ","d","i","s","a","b","l","e","d"," ","s","t","a","t","e"," ","o","f"," ","t","h","e"," ","c","o","n","s","o","l","e"," ","w","h","i","l","e"," ","t","h","e"," ","m","o","d","e","l"," ","i","s"," ","g","e","n","e","r","a","t","i","n","g"," ","t","e","x","t","."]
}
```

---

## Implementation Notes

- **Ghost text vs textarea value**: When ArrowUp is pressed with an empty textarea, the previous message appears in the `.chat-input-complete .text` overlay — **not** in the textarea's `.value`. Tests 4–6 must assert against `.chat-input-complete .text`, not the textarea value.
- **Tab key in textarea**: Standard Playwright `page.keyboard.press('Tab')` should work if the textarea already has focus. Verify focus before pressing Tab.
- **chunkSize for disabled-state tests**: Always use `chunkSize: 1` (single-character chunks) or many small chunks for Test 7 to ensure the disabled window is long enough to capture.
- **Session cookie**: The `R_SESS` cookie is required to authenticate mock service API calls. Extract it after logging in via `page.context().cookies()` or `page.evaluate(() => document.cookie)`.
- **Message ID assumptions**: All tests assume a fresh chat session. Message ID 1 is always the welcome message; subsequent IDs follow the conversation order.
