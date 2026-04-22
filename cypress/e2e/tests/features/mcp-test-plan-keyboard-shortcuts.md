# MCP E2E Test Plan: Keyboard Shortcuts

**Feature Area**: keyboard-shortcuts  
**Date Created**: 2026-04-22  
**Plan Type**: Initial  
**Execution Method**: MCP Playwright (not Cypress)

## Source Components Analyzed

- `pkg/rancher-ai-ui/composables/useKeyboardShortcutsComposable.ts` — registers
  `keydown` handlers for `Ctrl+Shift+O`, `Ctrl+Shift+C`, `Ctrl+Shift+S`,
  `Ctrl+Shift+Backspace` (Linux/Windows) and their macOS equivalents
- `pkg/rancher-ai-ui/components/header/KeyboardShortcuts.vue` — help popup that
  lists all shortcuts in a table; opened via the chat panel menu or
  `openShortcuts()`
- `pkg/rancher-ai-ui/components/header/ChatPanelMenu.vue` — three-option menu
  (Download, Keyboard Shortcuts, Config/Settings) that also covers the
  `shortcuts:chat` event path
- `pkg/rancher-ai-ui/components/popover/TextLabel.vue` — generic popover wrapper
  used by `KeyboardShortcuts.vue`
- `pkg/rancher-ai-ui/pages/Chat.vue` — wires keyboard shortcut callbacks:
  `onNewChat` → `ensureReconnectionAndLoadChat(null)`,
  `onCopyLastMessage` → `copyLastAssistantMessage`,
  `onToggleHistory` → `toggleHistoryPanel`,
  `onDeleteChat` → `deleteCurrentChat`

## Prerequisites

- **Application URL**: `https://localhost:8005`
- **Login credentials**: `admin` / `password`
- **Self-signed TLS**: Playwright must be configured to ignore HTTPS errors
  (`ignoreHTTPSErrors: true`)
- **LLM mock service**: `http://localhost:1080` — enqueue responses before
  sending messages

---

## Test Cases

---

### Test 1: Alt+K keyboard shortcut opens the chat panel

**Description**: Verifies that pressing `Alt+K` (Linux/Windows) while the chat
panel is closed opens the panel.

**Preconditions**: Logged in; chat panel is closed.

**Steps**:
1. Navigate to `https://localhost:8005`.
2. Accept the self-signed certificate if prompted.
3. Log in with username `admin` and password `password`.
4. Wait for the Rancher Dashboard home page to load (look for the cluster list
   or navigation elements).
5. Confirm that the element `[data-testid="rancher-ai-ui-chat-container"]` is
   **not visible** (chat panel is closed).
6. Press `Alt+K` on the keyboard.
7. Wait up to 5 seconds for the element
   `[data-testid="rancher-ai-ui-chat-panel-ready"]` to become visible.

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is visible after the
  shortcut is pressed.
- The chat container `[data-testid="rancher-ai-ui-chat-container"]` is visible.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Screenshot**: `keyboard-shortcuts-mcp-test-1-alt-k-opens-panel`

---

### Test 2: Alt+K keyboard shortcut closes the chat panel

**Description**: Verifies that pressing `Alt+K` a second time closes the open
chat panel.

**Preconditions**: Logged in; chat panel is open and ready.

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible.
4. Press `Alt+K` again.
5. Wait up to 3 seconds.

**Assertions**:
- After the second `Alt+K`, the element
  `[data-testid="rancher-ai-ui-chat-panel-ready"]` is **no longer visible**.
- The element `[data-testid="rancher-ai-ui-chat-container"]` is no longer
  visible (or has `display:none`/is removed from the DOM).

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`
- `[data-testid="rancher-ai-ui-chat-container"]`

**Screenshot**: `keyboard-shortcuts-mcp-test-2-alt-k-closes-panel`

---

### Test 3: Ctrl+Shift+O creates a new chat session

**Description**: Verifies that pressing `Ctrl+Shift+O` while a chat session
with messages is active discards the current session and starts a fresh chat
with only the welcome message.

**Preconditions**: Logged in; chat panel is open and has at least one
user-sent message and one assistant reply.

**Mock LLM Setup** (enqueue before sending user message):

```http
PUT http://localhost:1080/mockserver/expectation
Content-Type: application/json

{
  "httpRequest": { "method": "POST" },
  "httpResponse": {
    "statusCode": 200,
    "body": "data: {\"type\":\"text\",\"content\":\"Hello from the mock agent.\"}\n\ndata: {\"type\":\"done\"}\n\n"
  }
}
```

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
4. Enqueue a mock LLM response via HTTP PUT to
   `http://localhost:1080/mockserver/expectation` (see Mock LLM Setup above).
5. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type
   `Test message for new-chat shortcut`.
6. Press `Enter` to send the message.
7. Wait until the assistant reply message appears and is completed (look for the
   second message box to be visible and no longer streaming).
8. Press `Ctrl+Shift+O`.
9. Wait up to 5 seconds for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
   to appear (the chat reinitialises).

**Assertions**:
- After `Ctrl+Shift+O`, the chat console shows **only one message** (the
  welcome/system message) — the previous user message and assistant reply are
  gone.
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is visible again.
- The input textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is
  empty.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Screenshot**: `keyboard-shortcuts-mcp-test-3-ctrl-shift-o-new-chat`

---

### Test 4: Ctrl+Shift+S toggles the history panel open and closed

**Description**: Verifies that pressing `Ctrl+Shift+S` opens the history panel
and pressing it again closes the panel.

**Preconditions**: Logged in; chat panel is open.

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
4. Confirm that the history panel `[data-testid="rancher-ai-ui-chat-history-panel"]`
   is **not visible**.
5. Press `Ctrl+Shift+S`.
6. Wait up to 3 seconds for the history panel to appear.
7. Take a screenshot to confirm the panel is open.
8. Press `Ctrl+Shift+S` again.
9. Wait up to 3 seconds.

**Assertions**:
- After the first `Ctrl+Shift+S`, the element
  `[data-testid="rancher-ai-ui-chat-history-panel"]` is visible.
- After the second `Ctrl+Shift+S`, the element
  `[data-testid="rancher-ai-ui-chat-history-panel"]` is **no longer visible**.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-history-panel"]`
- `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]`

**Screenshot**: `keyboard-shortcuts-mcp-test-4-ctrl-shift-s-history-panel`

---

### Test 5: Ctrl+Shift+C copies the last assistant message to the clipboard

**Description**: Verifies that pressing `Ctrl+Shift+C` copies the text of the
most recent assistant message into the system clipboard.

**Preconditions**: Logged in; chat has at least one completed assistant reply.

**Mock LLM Setup** (enqueue before sending user message):

```http
PUT http://localhost:1080/mockserver/expectation
Content-Type: application/json

{
  "httpRequest": { "method": "POST" },
  "httpResponse": {
    "statusCode": 200,
    "body": "data: {\"type\":\"text\",\"content\":\"Clipboard test content from mock agent.\"}\n\ndata: {\"type\":\"done\"}\n\n"
  }
}
```

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
4. Enqueue the mock LLM response via HTTP PUT to
   `http://localhost:1080/mockserver/expectation`.
5. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type
   `Please give me something to copy`.
6. Press `Enter` to send the message.
7. Wait for the assistant reply to complete (wait for the second message box to
   appear and stop streaming — wait at least 3 seconds after it appears).
8. Grant clipboard permissions to the browser context (or use Playwright's
   `grantPermissions(['clipboard-read', 'clipboard-write'])`).
9. Press `Ctrl+Shift+C`.
10. Wait 500 ms.
11. Read the clipboard content via `page.evaluate(() => navigator.clipboard.readText())`.

**Assertions**:
- The clipboard text contains `Clipboard test content from mock agent.`
  (or matches the text of the assistant reply visible in the chat).

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Screenshot**: `keyboard-shortcuts-mcp-test-5-ctrl-shift-c-clipboard`

---

### Test 6: Ctrl+Shift+Backspace deletes the current chat

**Description**: Verifies that pressing `Ctrl+Shift+Backspace` triggers the
delete-chat confirmation dialog and, after confirmation, the current chat is
deleted and a fresh chat is started.

**Preconditions**: Logged in; chat panel is open with at least one user message
sent.

**Mock LLM Setup** (enqueue before sending user message):

```http
PUT http://localhost:1080/mockserver/expectation
Content-Type: application/json

{
  "httpRequest": { "method": "POST" },
  "httpResponse": {
    "statusCode": 200,
    "body": "data: {\"type\":\"text\",\"content\":\"Delete test response.\"}\n\ndata: {\"type\":\"done\"}\n\n"
  }
}
```

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
4. Enqueue a mock LLM response.
5. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type
   `Message before deletion`.
6. Press `Enter` to send.
7. Wait for the assistant reply to complete.
8. Press `Ctrl+Shift+Backspace`.
9. Wait up to 3 seconds for a deletion confirmation modal to appear.
10. Click the confirmation button
    `[data-testid="rancher-ai-ui-delete-chat-confirm-button"]`.
11. Wait up to 5 seconds for the chat to reset.

**Assertions**:
- A confirmation modal appears after pressing `Ctrl+Shift+Backspace`.
- After clicking the confirm button, the previous user message (`Message before deletion`)
  is no longer visible.
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is visible again (new chat
  is initialized).
- The chat shows only the initial welcome message (one message, no user
  messages).

**Selectors**:
- `[data-testid="rancher-ai-ui-delete-chat-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot**: `keyboard-shortcuts-mcp-test-6-ctrl-shift-backspace-delete`

---

### Test 7: Chat panel menu opens keyboard shortcuts help popup

**Description**: Verifies that clicking the chat panel's action menu button and
then selecting "Keyboard shortcuts" reveals the shortcuts help popup listing
all available shortcuts.

**Preconditions**: Logged in; chat panel is open and ready.

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
4. In the chat header area, locate the actions menu button — it is a button
   containing the CSS class `icon-actions`. Click that button
   (use selector `.chat-console-menu-container .icon-actions` or
   `.chat-console-menu-container button`).
5. Wait up to 2 seconds for the dropdown menu to appear.
6. Look for a dropdown item containing the text `Keyboard shortcuts` (or the
   translated equivalent) and click it.
7. Wait up to 2 seconds for the keyboard shortcuts popover to appear.

**Assertions**:
- The popover/popup is visible and contains a section with title matching
  `Keyboard shortcuts` (or `Shortcuts`).
- The popup lists at least the following actions:
  - Open/Close chat (Alt K or ⌘ Shift K)
  - New chat (Ctrl Shift O or ⌘ Shift O)
  - Copy last message (Ctrl Shift C or ⌘ Shift C)
  - Toggle history (Ctrl Shift S or ⌘ Shift S)
  - Delete chat (Ctrl Shift ⌫ or ⌘ Shift ⌫)

**Selectors**:
- `.chat-console-menu-container .icon-actions` (menu trigger button)
- Text `Keyboard shortcuts` (dropdown item label)
- `.shortcuts` (popover content container)
- `.shortcuts-title` (shortcuts popup title)
- `.shortcuts-row` (individual shortcut rows)

**Screenshot**: `keyboard-shortcuts-mcp-test-7-shortcuts-popup`

---

### Test 8: Chat panel menu navigates to AI settings page

**Description**: Verifies that clicking the "AI settings" / Config option in
the chat panel menu navigates the user to the AI Assistant settings page.

**Preconditions**: Logged in; chat panel is open and ready.

**Steps**:
1. Navigate to `https://localhost:8005` and log in.
2. Press `Alt+K` to open the chat panel.
3. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`.
4. Click the actions menu button (`.chat-console-menu-container .icon-actions`).
5. Wait for the dropdown menu to appear.
6. Look for the dropdown item containing the text `AI settings` (or `Config`
   or `Settings`) and click it.
7. Wait up to 5 seconds for page navigation to complete.

**Assertions**:
- The page URL changes to contain `/ai-ui` or the AI settings route path.
- The heading `AI Assistant Configuration` is visible on the page.

**Selectors**:
- `.chat-console-menu-container .icon-actions`
- Text matching `AI settings` or `Config` (dropdown item)
- CSS/text `AI Assistant Configuration` (page heading)

**Screenshot**: `keyboard-shortcuts-mcp-test-8-menu-config-navigation`

---

## Mock Data Setup

For tests that send messages (Tests 3, 5, 6), enqueue mock LLM responses
**before** sending the user message. Use an HTTP PUT request:

```
PUT http://localhost:1080/mockserver/expectation
Content-Type: application/json

{
  "httpRequest": {
    "method": "POST"
  },
  "httpResponse": {
    "statusCode": 200,
    "headers": {
      "Content-Type": ["text/event-stream"]
    },
    "body": "data: {\"type\":\"text\",\"content\":\"<YOUR RESPONSE TEXT>\"}\n\ndata: {\"type\":\"done\"}\n\n"
  }
}
```

Replace `<YOUR RESPONSE TEXT>` with the response text expected in that test.

To clear enqueued responses after all tests complete:

```
PUT http://localhost:1080/mockserver/reset
```

---

## Selector Reference

| Selector | Component | Description |
|----------|-----------|-------------|
| `[data-testid="rancher-ai-ui-chat-container"]` | `pages/Chat.vue` | Chat panel root |
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | `pages/Chat.vue` | Panel loaded and WS connected |
| `[data-testid="rancher-ai-ui-chat-close-button"]` | `panels/Header.vue` | Close button in header |
| `[data-testid="rancher-ai-ui-chat-history-button"]` | `panels/Header.vue` | Toggle history button |
| `[data-testid="rancher-ai-ui-chat-history-panel"]` | `panels/History.vue` | History panel |
| `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]` | `panels/History.vue` | History panel backdrop |
| `[data-testid="rancher-ai-ui-chat-input-textarea"]` | `panels/Console.vue` | Message input |
| `[data-testid="rancher-ai-ui-delete-chat-confirm-button"]` | Dialog | Delete confirmation button |
| `.chat-console-menu-container .icon-actions` | `header/ChatPanelMenu.vue` | Three-dot actions menu trigger |
| `.shortcuts` | `header/KeyboardShortcuts.vue` | Shortcuts popup container |
| `.shortcuts-title` | `header/KeyboardShortcuts.vue` | Popup section title |
| `.shortcuts-row` | `header/KeyboardShortcuts.vue` | Individual shortcut row |
