# MCP Test Plan: History Panel

**Feature Area:** `history-panel`
**Date Created:** 2026-03-31
**Execution Method:** MCP Playwright (AI agent with Playwright browser automation — no Cypress spec)

## Source Components Analyzed

| Component | Path |
|-----------|------|
| History panel | `pkg/rancher-ai-ui/components/panels/History.vue` |
| History header button | `pkg/rancher-ai-ui/components/panels/Header.vue` |
| History panel header | `pkg/rancher-ai-ui/components/history/HistoryHeader.vue` |
| History chat item menu | `pkg/rancher-ai-ui/components/history/HistoryChatMenu.vue` |
| Delete chat dialog | `pkg/rancher-ai-ui/dialog/DeleteChatCard.vue` |
| Chat page | `pkg/rancher-ai-ui/pages/Chat.vue` |
| History PO | `cypress/e2e/po/history.po.ts` |
| History spec | `cypress/e2e/tests/features/history/chat.spec.ts` |

---

## Prerequisites

- **Application URL:** `https://localhost:8005`
- **Login credentials:** username `admin`, password from `CATTLE_BOOTSTRAP_PASSWORD` (default: `admin`)
- **Self-signed certificate:** Configure Playwright to ignore HTTPS errors (`ignoreHTTPSErrors: true`)
- **LLM mock service:** Enqueue responses via `POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push`
- **Clear mock responses:** `POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear`
- **State:** Each test assumes a fresh chat state. Use the "Start a New Chat" button or clear chat history via the API between tests.
- **Note:** The history panel button (`[data-testid="rancher-ai-ui-chat-history-button"]`) is only visible if the user has the required permissions and the chat panel is open.

---

## Selector Reference

| Selector | Element |
|----------|---------|
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | Chat panel loaded indicator |
| `[data-testid="rancher-ai-ui-chat-history-button"]` | Open/close history button in chat panel header |
| `[data-testid="rancher-ai-ui-chat-history-panel"]` | History panel root element |
| `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]` | History panel overlay (click outside panel to close) |
| `[data-testid="rancher-ai-ui-chat-history-header-button"]` | Close history button inside the history panel |
| `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]` | "Start a New Chat" button inside history panel |
| `[data-testid="rancher-ai-ui-chat-history-chat-item-{N}"]` | History chat item at index N (0-based) |
| `[data-testid="rancher-ai-ui-chat-history-item-name"]` | Chat item name span (inside a chat item) |
| `[data-testid="rancher-ai-ui-chat-history-item-name-input"]` | Chat name edit input (only during rename) |
| `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]` | Per-item kebab menu trigger (visible on hover) |
| `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-rename-chat"]` | "Rename Chat" menu option |
| `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat"]` | "Delete Chat" menu option |
| `[data-testid="prompt-remove-confirm-button"]` | Delete confirmation button in modal |
| `[data-testid="rancher-ai-ui-chat-input-textarea"]` | Message input textarea |
| `.focused` | Class applied to the active chat item |

---

## Mock Data Setup

For tests that send a message and need an AI response, enqueue a mock response **before** typing the message.

**Enqueue a mock response:**

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Content-Type: application/json
Cookie: R_SESS=<session-cookie>

{
  "agent": "rancher",
  "text": {
    "chunks": ["Hello! I can help you with your Kubernetes cluster."]
  }
}
```

**Clear all enqueued responses:**

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear
Content-Type: application/json
Cookie: R_SESS=<session-cookie>
```

> **Note:** The session cookie (`R_SESS`) is set automatically after login. Use Playwright's request context (which inherits browser cookies) to call these endpoints after logging in.

---

## Test Cases

---

### Test 1: Open history panel via header button

**Description:** Verifies that clicking the history icon button in the chat panel header opens the history panel with the expected UI elements.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready (no messages required)
- No prerequisite chat history needed

**Steps:**

1. Navigate to `https://localhost:8005`
2. Log in with username `admin` and password from `CATTLE_BOOTSTRAP_PASSWORD`
3. Click the AI assistant button in the Rancher header to open the chat panel, OR press `Alt+K`
4. Wait for element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (timeout: 30s)
5. Click element `[data-testid="rancher-ai-ui-chat-history-button"]` to open the history panel
6. Wait 500ms for the slide-in animation to complete
7. Take a screenshot named `history-panel-mcp-test-1-open-panel`

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-history-panel"]` is visible
- `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]` is visible and contains the text "Start a New Chat"
- `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]` is present in the DOM

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-button"]`
- `[data-testid="rancher-ai-ui-chat-history-panel"]`
- `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]`
- `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]`

---

### Test 2: Close history panel by clicking the overlay

**Description:** Verifies that clicking outside the history panel (on the semi-transparent overlay) closes the panel.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- History panel is open (perform Test 1 steps first)

**Steps:**

1. Navigate to `https://localhost:8005` and log in as `admin`
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to open history panel
4. Wait 500ms for animation
5. Verify `[data-testid="rancher-ai-ui-chat-history-panel"]` is visible
6. Click the overlay element `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]` at coordinates outside the panel (e.g., right side of the overlay, not inside the panel area)
7. Wait 500ms for the slide-out animation to complete
8. Take a screenshot named `history-panel-mcp-test-2-close-by-overlay`

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-history-panel"]` is NOT visible (or not in DOM)
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is still visible (chat panel remains open)

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-panel-overlay"]`
- `[data-testid="rancher-ai-ui-chat-history-panel"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Implementation Notes:**
- The overlay is the full-width/height element; the history panel itself is on the left side (min 75% wide). Click at a position on the right edge of the overlay to ensure the click lands outside the panel area.
- In Playwright: `await page.locator('[data-testid="rancher-ai-ui-chat-history-panel-overlay"]').click({ position: { x: 900, y: 200 } })`

---

### Test 3: Close history panel via the internal header button

**Description:** Verifies that clicking the burger menu icon button inside the history panel header closes the panel.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- History panel is open

**Steps:**

1. Navigate to `https://localhost:8005` and log in as `admin`
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to open the history panel
4. Wait 500ms for animation
5. Verify `[data-testid="rancher-ai-ui-chat-history-panel"]` is visible
6. Click `[data-testid="rancher-ai-ui-chat-history-header-button"]` inside the history panel header
7. Wait 500ms for the slide-out animation to complete
8. Take a screenshot named `history-panel-mcp-test-3-close-by-header-button`

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-history-panel"]` is NOT visible (or not in DOM)
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is still visible (chat panel remains open)

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-header-button"]`
- `[data-testid="rancher-ai-ui-chat-history-panel"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

---

### Test 4: Empty chats are not saved to history

**Description:** Verifies that a chat session with no user messages is not persisted to the history list when a new chat is created.

**Preconditions:**
- Logged in as `admin`
- Chat panel is open and ready
- No user messages have been sent in the current chat session
- History is empty (start from a clean state)

**Steps:**

1. Navigate to `https://localhost:8005` and log in as `admin`
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to open history panel
4. Wait 500ms for animation
5. Verify there are NO elements matching `[data-testid^="rancher-ai-ui-chat-history-chat-item-"]` (empty history list or "Previous Chats" section not shown)
6. Click `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]` to create a new chat
7. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible again (new chat initialized)
8. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to reopen the history panel
9. Wait 500ms for animation
10. Take a screenshot named `history-panel-mcp-test-4-empty-chat-discarded`

**Assertions:**
- After step 5: No chat items are present (`[data-testid^="rancher-ai-ui-chat-history-chat-item-"]` count is 0 or the element does not exist)
- After step 10: Still no chat items are present — the empty chat was NOT saved to history

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-button"]`
- `[data-testid^="rancher-ai-ui-chat-history-chat-item-"]`
- `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

---

### Test 5: Chat with messages appears in history list

**Description:** Verifies that after sending at least one user message and creating a new chat, the previous conversation appears in the history list with a name matching the first user message.

**Preconditions:**
- Logged in as `admin`
- History is clean (start fresh or use Test 4 state)
- One mock LLM response enqueued before sending a message

**Steps:**

1. Navigate to `https://localhost:8005` and log in as `admin`
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Enqueue a mock LLM response via a POST request (see Mock Data Setup):
   - Body: `{ "agent": "rancher", "text": { "chunks": ["This is the AI response."] } }`
4. Click `[data-testid="rancher-ai-ui-chat-input-textarea"]` to focus the message input
5. Type the message: `History test message`
6. Press `Enter` to send the message
7. Wait for a new element containing the text "This is the AI response." to appear in the chat console (timeout: 15s)
8. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to open the history panel
9. Wait 500ms for animation
10. Click `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]` to create a new chat
11. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible again
12. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to reopen the history panel
13. Wait 500ms for animation
14. Take a screenshot named `history-panel-mcp-test-5-chat-in-history`

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` exists and is visible
- The text inside `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` (specifically `[data-testid="rancher-ai-ui-chat-history-item-name"]`) contains `"History test message"`
- Exactly 1 chat item is present in the list

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-history-button"]`
- `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]`
- `[data-testid="rancher-ai-ui-chat-history-item-name"]`

---

### Test 6: Load a previous chat from history

**Description:** Verifies that clicking on a history chat item restores that conversation in the chat panel, displaying the original user and AI messages.

**Preconditions:**
- (Continue from Test 5 state) History contains one chat with messages `"History test message"` / `"This is the AI response."`
- A new empty chat is currently active

**Steps:**

1. (Perform Test 5 setup to have one chat in history and be on a new empty chat)
2. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Click `[data-testid="rancher-ai-ui-chat-history-button"]` to open history panel
4. Wait 500ms for animation
5. Verify `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` is present
6. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` to load the previous chat
7. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (chat loaded)
8. Wait 1s for messages to render
9. Take a screenshot named `history-panel-mcp-test-6-load-previous-chat`

**Assertions:**
- The history panel closes (or remains closed) after selecting a chat
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is visible
- The chat console contains the text `"History test message"` (original user message is visible in the restored chat)
- The chat console contains the text `"This is the AI response."` (original AI response is visible in the restored chat)
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` has the CSS class `focused` (indicating it is the active chat)

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`
- `.focused`

**Implementation Notes:**
- After clicking a history item, the history panel may or may not auto-close. Check whether the panel closes automatically; if it does not, close it manually before asserting message content.
- Message IDs in the restored chat start at 1 for the first message (the AI welcome message), then 2 for the first user message and 3 for the first AI response (or the order may vary if no welcome message is displayed for a loaded chat — use text-based assertions rather than message ID assertions).

---

### Test 7: Rename a chat via the history item menu

**Description:** Verifies that a chat can be renamed via the per-item dropdown menu, and the new name persists after closing and reopening the history panel.

**Preconditions:**
- History contains at least one chat (use Test 5 setup to create one)
- History panel is open

**Steps:**

1. (Perform Test 5 setup to have one chat in history)
2. Open the history panel by clicking `[data-testid="rancher-ai-ui-chat-history-button"]`
3. Wait 500ms for animation
4. Hover over `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` to reveal the item menu button
5. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]` to open the dropdown menu
6. Wait for the dropdown to appear (100–300ms)
7. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-rename-chat"]` to select "Rename Chat"
8. Wait for `[data-testid="rancher-ai-ui-chat-history-item-name-input"]` to be visible
9. Clear the input field
10. Type the new name: `Renamed History Chat`
11. Press `Enter` to confirm the rename
12. Wait 500ms for the update to process
13. Take a screenshot named `history-panel-mcp-test-7-rename-chat-confirmed`
14. Close the history panel by clicking `[data-testid="rancher-ai-ui-chat-history-header-button"]`
15. Wait 500ms, then reopen the history panel by clicking `[data-testid="rancher-ai-ui-chat-history-button"]`
16. Wait 500ms for animation
17. Take a screenshot named `history-panel-mcp-test-7-rename-chat-persisted`

**Assertions:**
- After step 12: `[data-testid="rancher-ai-ui-chat-history-item-name-input"]` is no longer visible (edit mode exited)
- After step 12: `[data-testid="rancher-ai-ui-chat-history-item-name"]` inside chat item 0 contains the text `"Renamed History Chat"`
- After step 17 (panel reopened): `[data-testid="rancher-ai-ui-chat-history-item-name"]` inside chat item 0 still contains `"Renamed History Chat"` (rename persisted)

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-rename-chat"]`
- `[data-testid="rancher-ai-ui-chat-history-item-name-input"]`
- `[data-testid="rancher-ai-ui-chat-history-item-name"]`
- `[data-testid="rancher-ai-ui-chat-history-header-button"]`
- `[data-testid="rancher-ai-ui-chat-history-button"]`

**Implementation Notes:**
- The item menu button (`rancher-ai-ui-chat-history-chat-item-menu-button`) only appears on hover. Use `hover()` on the chat item element before clicking the menu button.
- In Playwright: `await page.locator('[data-testid="rancher-ai-ui-chat-history-chat-item-0"]').hover()`
- The rename input has `maxlength="64"`. The new name `"Renamed History Chat"` is within this limit.

---

### Test 8: Delete a non-active chat from history

**Description:** Verifies that a chat that is NOT currently active can be deleted via the per-item menu, and the delete confirmation modal must be confirmed before the chat is removed.

**Preconditions:**
- History contains at least two chats, and a different chat is currently active (not the one being deleted)
- OR: History contains one chat and a new empty chat is the active one

**Steps:**

1. Enqueue a mock response: `{ "agent": "rancher", "text": { "chunks": ["First chat response."] } }`
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Type `First chat message` in `[data-testid="rancher-ai-ui-chat-input-textarea"]` and press Enter
4. Wait for the text "First chat response." to appear in the chat console
5. Open history panel → click `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]` to save and create new chat
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
7. Open history panel again, verify `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` exists
8. Hover over `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` to reveal menu
9. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]`
10. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat"]`
11. Wait for the delete confirmation modal to appear (look for element containing "Delete Chat" title text or `[data-testid="prompt-remove-confirm-button"]`)
12. Take a screenshot named `history-panel-mcp-test-8-delete-confirm-modal`
13. Click `[data-testid="prompt-remove-confirm-button"]` to confirm deletion
14. Wait 1s for the deletion to process
15. Take a screenshot named `history-panel-mcp-test-8-chat-deleted`

**Assertions:**
- After step 11: The delete confirmation modal is visible, containing the text "Delete Chat" and a delete button
- After step 11: `[data-testid="prompt-remove-confirm-button"]` is visible
- After step 13: The modal is no longer visible
- After step 14: `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` does NOT exist in the history panel (the deleted chat is removed from the list)
- The active (new empty) chat remains open and `[data-testid="rancher-ai-ui-chat-panel-ready"]` is still visible

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat"]`
- `[data-testid="prompt-remove-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Implementation Notes:**
- The delete modal is rendered inside an `<app-modal>` with a `<Card class="prompt-remove">` wrapper. The modal title text from i18n is `"Delete Chat"` (key: `promptRemove.title`).
- The warning message from i18n: `"You are attempting to delete the chat "` followed by a truncated chat name (max 13 chars, truncated to 10 + `"..."`).

---

### Test 9: Deleting the active chat initializes a new chat

**Description:** Verifies that when the currently active chat is deleted, the chat panel automatically initializes a new empty chat session, the history panel closes, and the deleted chat no longer appears in history.

**Preconditions:**
- History contains at least one chat
- That chat is the currently active chat (it has the `.focused` class in the history list)

**Steps:**

1. Enqueue a mock response: `{ "agent": "rancher", "text": { "chunks": ["Active chat response."] } }`
2. Open the chat panel and wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
3. Type `Active chat message` in `[data-testid="rancher-ai-ui-chat-input-textarea"]` and press Enter
4. Wait for the text "Active chat response." to appear in the chat console
5. Open history panel → click `[data-testid="rancher-ai-ui-chat-history-create-chat-button"]` (saves current chat to history and creates a new one)
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]`
7. Open history panel, click `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` to switch back to the previously saved chat
8. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` (loaded the chat)
9. Open history panel again
10. Verify `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` has class `focused` (it is the active chat)
11. Hover over `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` to reveal menu
12. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]`
13. Click `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat"]`
14. Wait for the delete confirmation modal: `[data-testid="prompt-remove-confirm-button"]` to be visible
15. Click `[data-testid="prompt-remove-confirm-button"]` to confirm deletion
16. Wait 2s for the new chat to initialize
17. Take a screenshot named `history-panel-mcp-test-9-active-chat-deleted`

**Assertions:**
- After deletion: `[data-testid="rancher-ai-ui-chat-history-panel"]` is NOT visible (history panel auto-closes)
- `[data-testid="rancher-ai-ui-chat-panel-ready"]` is visible (new chat is ready)
- The chat console does NOT contain the text "Active chat message" (new empty chat, not the deleted one)
- The chat console does NOT contain the text "Active chat response."
- After opening history panel: `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]` does NOT exist (deleted chat removed; if there was only one chat, the history list is empty)

**Selectors Used:**
- `[data-testid="rancher-ai-ui-chat-history-chat-item-0"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button"]`
- `[data-testid="rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat"]`
- `[data-testid="prompt-remove-confirm-button"]`
- `[data-testid="rancher-ai-ui-chat-history-panel"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`
- `.focused`

**Implementation Notes:**
- From `Chat.vue` source: when the active chat is deleted (`deleteChat()`), if the deleted chat ID matches `chatMetadata.value.chatId`, `ensureReconnectionAndLoadChat(null)` is called, which initializes a new chat session. The history panel is set to `showHistory.value = false` in `Chat.vue` during new chat initialization.
- The deleted chat disappears from `chatHistory` because `fetchChats()` is re-called after deletion.

---

## Summary

| Test | Description | Mock Required |
|------|-------------|---------------|
| Test 1 | Open history panel via header button | No |
| Test 2 | Close history panel by clicking overlay | No |
| Test 3 | Close history panel via internal header button | No |
| Test 4 | Empty chats are not saved to history | No |
| Test 5 | Chat with messages appears in history list | Yes (1 response) |
| Test 6 | Load a previous chat from history | Yes (continue from Test 5) |
| Test 7 | Rename a chat via history item menu | Yes (continue from Test 5) |
| Test 8 | Delete a non-active chat from history | Yes (1 response) |
| Test 9 | Deleting the active chat initializes a new chat | Yes (1 response) |
