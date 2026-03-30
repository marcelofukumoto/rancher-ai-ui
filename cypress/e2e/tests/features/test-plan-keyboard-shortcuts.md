# Test Plan: Keyboard Shortcuts

**Feature Area:** `keyboard-shortcuts`
**Date Created:** 2026-03-30
**Spec File Location:** `cypress/e2e/tests/features/keyboard-shortcuts.spec.ts`

## Source Components Analyzed

| File | Purpose |
|------|---------|
| `pkg/rancher-ai-ui/composables/useKeyboardShortcutsComposable.ts` | Core shortcut handler logic: new chat, copy, toggle history, delete chat |
| `pkg/rancher-ai-ui/components/header/KeyboardShortcuts.vue` | Popover component rendering all shortcuts with platform-aware labels |
| `pkg/rancher-ai-ui/components/header/ChatPanelMenu.vue` | Header ⋮ dropdown with download / shortcuts / config items |
| `pkg/rancher-ai-ui/components/panels/Header.vue` | Chat header layout; emits `shortcuts:chat` and `toggle:history` |
| `pkg/rancher-ai-ui/components/panels/Console.vue` | Textarea; handles `ArrowUp`/`ArrowDown` for prompt history navigation |
| `pkg/rancher-ai-ui/pages/Chat.vue` | Top-level page that wires all composables and handles `keydown` events |

---

## Test Cases

### Test 1: Open and close chat panel via keyboard shortcut

**Description:** Verifies that the global Alt+K shortcut (Linux/Windows) opens and then closes the AI chat panel from any page.

**Preconditions:**
- User is logged in
- Chat panel is closed
- Navigate to the Home page

**Steps:**
1. Ensure the chat panel is not visible.
2. Press `Alt+K` on the `body` element.
3. Assert the chat panel is open and ready.
4. Press `Alt+K` again on the `body` element.
5. Assert the chat panel is closed.

**Assertions:**
- After step 2: `[data-testid="rancher-ai-ui-chat-container"]` is visible.
- After step 2: `[data-testid="rancher-ai-ui-chat-panel-ready"]` exists.
- After step 4: `[data-testid="rancher-ai-ui-chat-container"]` does not exist.

**Selectors:**
- `body` — target for the global keyboard event
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Screenshot:** `keyboard-shortcuts-test-1-open-close-chat`

---

### Test 2: Open a new chat session via keyboard shortcut

**Description:** Verifies that `Ctrl+Shift+O` (Linux/Windows) creates a new empty chat, resetting the message list.

**Preconditions:**
- User is logged in and the chat panel is open.
- At least one message has been sent so the chat is not empty.
- Enqueue an LLM response before sending.

**Steps:**
1. Open the chat panel.
2. Wait for the welcome message (message 1) to be completed.
3. Enqueue a mock LLM response.
4. Send a message (e.g. `"Hello from the test"`).
5. Wait for the AI response (message 3) to be completed.
6. Focus the chat container: `cy.get('[data-testid="rancher-ai-ui-chat-container"]')`.
7. Type `{ctrl}{shift}o` into the chat container.
8. Wait for the new welcome message to appear and be completed.

**Assertions:**
- After step 8: Message 1 exists and contains the welcome text (the old messages are gone).
- There is no message 2 yet (new chat is empty except for the welcome message).

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-message-box-1"]`

**Screenshot:** `keyboard-shortcuts-test-2-new-chat`

---

### Test 3: Toggle history panel via keyboard shortcut

**Description:** Verifies that `Ctrl+Shift+S` opens and closes the chat history side panel.

**Preconditions:**
- User is logged in.
- Chat panel is open and ready.
- History panel is closed.

**Steps:**
1. Open the chat panel and wait for it to be ready.
2. Assert the history panel is not visible.
3. Press `{ctrl}{shift}s` inside the chat container.
4. Wait 500 ms for the panel animation.
5. Assert the history panel is visible.
6. Press `{ctrl}{shift}s` inside the chat container again.
7. Wait 500 ms.
8. Assert the history panel is no longer visible.

**Assertions:**
- After step 2: `[data-testid="rancher-ai-ui-chat-history-panel"]` does not exist.
- After step 5: `[data-testid="rancher-ai-ui-chat-history-panel"]` exists.
- After step 8: `[data-testid="rancher-ai-ui-chat-history-panel"]` does not exist.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-history-panel"]`

**Screenshot:** `keyboard-shortcuts-test-3-toggle-history`

---

### Test 4: Delete current chat via keyboard shortcut

**Description:** Verifies that `Ctrl+Shift+Backspace` triggers the delete-chat confirmation dialog, and confirming it clears the current chat.

**Preconditions:**
- User is logged in.
- Chat panel is open and has at least one user message.
- Enqueue an LLM response before sending.

**Steps:**
1. Open the chat panel, wait for welcome message (message 1) to complete.
2. Enqueue a mock LLM response.
3. Send the message `"Message to delete"`.
4. Wait for the AI response (message 3) to complete.
5. Press `{ctrl}{shift}{backspace}` inside the chat container.
6. Assert a confirmation dialog appears.
7. Click the confirm button inside the dialog.
8. Wait for the new welcome message (message 1) to be completed.

**Assertions:**
- After step 6: A card with `[data-testid="card"].prompt-remove` is visible.
- After step 8: Message 1 is the welcome message (chat has been reset).
- There is no message 2 (old messages are gone).

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="card"].prompt-remove` — delete confirmation dialog (via `DeleteChatPromptPo`)
- `[data-testid="prompt-remove-confirm-button"]` — confirm button inside dialog

**Screenshot:** `keyboard-shortcuts-test-4-delete-chat`

---

### Test 5: Copy last AI response via keyboard shortcut

**Description:** Verifies that `Ctrl+Shift+C` copies the last AI response text to the clipboard.

**Preconditions:**
- User is logged in.
- Chat panel is open with at least one completed AI response.

**Steps:**
1. Grant clipboard-read permissions via `cy.wrap(Cypress.automation('remote:debugger:protocol', …))` or use Cypress clipboard grant.
2. Open the chat panel, wait for welcome message to complete.
3. Enqueue a mock LLM response with known text (e.g. `"Unique clipboard content"`).
4. Send the message `"Copy this response"`.
5. Wait for the AI response (message 3) to be completed.
6. Press `{ctrl}{shift}c` inside the chat container.
7. Read the clipboard value and assert it matches the expected AI response text.

**Assertions:**
- After step 7: Clipboard text equals the last AI message text (or contains `"Unique clipboard content"`).

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` (last one)

**Notes:**
- Clipboard read requires `cy.window().then(win => win.navigator.clipboard.readText())` after granting permissions.
- Alternatively, assert that `cy.document().then(…)` reflects the copied value, or spy on `navigator.clipboard.writeText`.

**Screenshot:** `keyboard-shortcuts-test-5-copy-last-message`

---

### Test 6: Open keyboard shortcuts reference from the chat header menu

**Description:** Verifies that clicking the ⋮ (actions) menu in the chat header and selecting the "Keyboard Shortcuts" option opens the shortcuts popover listing all available shortcuts.

**Preconditions:**
- User is logged in.
- Chat panel is open and ready.

**Steps:**
1. Open the chat panel, wait for it to be ready.
2. Find and click the `rc-dropdown-trigger` button with `icon-actions` inside the chat header.
3. Assert a dropdown appears.
4. Click the dropdown item that contains the shortcuts label.
5. Assert the shortcuts popover is visible and contains expected shortcut entries.

**Assertions:**
- After step 3: A dropdown collection is visible with at least the shortcuts option.
- After step 5: A popover element is visible that contains text for at least two shortcuts (e.g. `"Open / Close"` and `"New Chat"`).

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"] .icon-actions` — the ⋮ menu trigger (no data-testid; select via icon class)
- `.v-popper__popper` or `.shortcuts` — the rendered popover content

**Notes:**
- `ChatPanelMenu.vue` does not expose a `data-testid` on the trigger button; use `.icon-actions` icon inside the chat header `.chat-menu` div.

**Screenshot:** `keyboard-shortcuts-test-6-shortcuts-popover`

---

### Test 7: Keyboard shortcuts are disabled for a new empty chat

**Description:** Verifies that `Ctrl+Shift+O` (new chat) and `Ctrl+Shift+Backspace` (delete chat) do not trigger actions when the chat is in an empty/new state (disabled condition per composable).

**Preconditions:**
- User is logged in.
- Chat panel is open with an empty welcome-only state (no user messages).

**Steps:**
1. Open the chat panel, wait for the welcome message (message 1) to complete.
2. Press `{ctrl}{shift}o` inside the chat container (new chat — should be a no-op on empty chat).
3. Assert message 1 is still the welcome message and no reset occurred.
4. Press `{ctrl}{shift}{backspace}` inside the chat container (delete — should be a no-op).
5. Assert no confirmation dialog appears.

**Assertions:**
- After step 3: `[data-testid="rancher-ai-ui-chat-message-box-1"]` still shows the welcome message content (no new welcome message started loading).
- After step 5: `[data-testid="card"].prompt-remove` does not exist.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-message-box-1"]`
- `[data-testid="card"].prompt-remove`

**Screenshot:** `keyboard-shortcuts-test-7-shortcuts-disabled`

---

### Test 8: Navigate prompt history with arrow keys in textarea

**Description:** Verifies that pressing `ArrowUp` in the empty textarea recalls the previous user message, and `ArrowDown` navigates forward through message history.

**Preconditions:**
- User is logged in.
- Chat panel is open.
- At least two distinct user messages have been sent.

**Steps:**
1. Open the chat panel, wait for welcome message to complete.
2. Enqueue a mock LLM response and send `"First message"`. Wait for response to complete.
3. Enqueue a mock LLM response and send `"Second message"`. Wait for response to complete.
4. Click the textarea (`[data-testid="rancher-ai-ui-chat-input-textarea"]`) to focus it.
5. Ensure textarea is empty (it should be after sending).
6. Press `{uparrow}` in the textarea.
7. Assert the textarea value is `"Second message"` (most recent).
8. Press `{uparrow}` again.
9. Assert the textarea value is `"First message"`.
10. Press `{downarrow}`.
11. Assert the textarea value is `"Second message"` again.

**Assertions:**
- After step 7: Textarea value equals `"Second message"`.
- After step 9: Textarea value equals `"First message"`.
- After step 11: Textarea value equals `"Second message"`.

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot:** `keyboard-shortcuts-test-8-prompt-history-navigation`

---

## Page Objects Needed

### New Page Objects

| File | Class | Purpose |
|------|-------|---------|
| `cypress/e2e/po/keyboard-shortcuts.po.ts` | `KeyboardShortcutsPo` | Wraps the shortcuts popover; provides methods to open via menu and assert content |

**Suggested `KeyboardShortcutsPo` interface:**

```typescript
export class KeyboardShortcutsPo extends ComponentPo {
  constructor() {
    // The popover renders outside the chat container; target the shortcuts content div
    super('.shortcuts');
  }

  isVisible() {
    return this.checkExists();
  }

  containsShortcut(actionText: string) {
    return this.self().contains(actionText);
  }
}
```

### Existing Page Objects to Reuse

| PO | Used In |
|----|---------|
| `ChatPo` (`@/cypress/e2e/po/chat.po`) | All tests — open/close chat, get messages, send messages |
| `HistoryPo` (`@/cypress/e2e/po/history.po`) | Test 3 — assert history panel open/closed state |
| `DeleteChatPromptPo` (`@/cypress/e2e/po/dialog/delete-chat.po`) | Test 4 — confirm delete dialog |
| `ConsolePo` (`@/cypress/e2e/po/console.po`) | Test 8 — access textarea directly |
| `HomePagePo` (`@rancher/cypress/e2e/po/pages/home.po`) | All tests — navigate to a known page before opening chat |

---

## Custom Commands

### Existing Commands to Use

| Command | Used In |
|---------|---------|
| `cy.login()` | All tests (`beforeEach`) |
| `cy.enqueueLLMResponse({ text })` | Tests 2, 3, 4, 5, 8 — queue AI replies before sending messages |
| `cy.cleanChatHistory()` | `before()` hook — ensure clean state |
| `cy.clearLLMResponses()` | `after()` hook — clean up queued responses |

### Potential New Commands

- None strictly required; all interactions can be expressed with existing commands and direct `cy.get().type()` calls.

---

## Mock Data

### LLM Responses to Enqueue

| Test | Mock Text | Notes |
|------|-----------|-------|
| Test 2 | `"New chat response"` | Any text; used to verify the chat resets after Ctrl+Shift+O |
| Test 4 | `"Response before delete"` | Any text; ensures there is content before Ctrl+Shift+Backspace |
| Test 5 | `"Unique clipboard content from the AI"` | Must be distinct so clipboard assertion is reliable |
| Test 8 | `"First response"`, `"Second response"` | Two separate enqueue calls for two messages |

### API Mocks

No additional API mocks are needed beyond the built-in LLM mock service (`cy.enqueueLLMResponse`).

---

## Spec File Location

```
cypress/e2e/tests/features/keyboard-shortcuts.spec.ts
```

---

## Notes and Risks

- **Platform detection:** `Cypress.platform === 'darwin'` selects Mac key combos. All CI runners are Linux, so tests should default to the `Alt`/`Ctrl` variants.
- **`ChatPanelMenu` trigger:** The `ChatPanelMenu.vue` drop-down trigger has no `data-testid`. Use `.chat-menu .icon-actions` as the selector until a testid is added to the component.
- **Clipboard in Cypress:** Clipboard API requires `cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Browser.grantPermissions', … }))` or stubbing `navigator.clipboard.writeText` with `cy.stub`. The stub approach is more reliable in headless Cypress.
- **Animation waits:** Use `cy.wait(500)` after shortcut actions that trigger slide-in/out animations (history panel, new chat transition) to avoid flakiness.
- **Disabled shortcuts:** The `disabled` callback in `useKeyboardShortcutsComposable` returns `true` when the chat has no user messages. Tests 2 and 4 have distinct variants: one with content (shortcut fires) and Test 7 verifies the disabled path.
