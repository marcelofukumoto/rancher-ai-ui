# Test Plan: Console Feature Area

**Date Created:** 2026-03-31
**Feature Area:** `console`
**Spec File Location:** `cypress/e2e/tests/features/console.spec.ts`

## Source Components Analyzed

| Component | Path |
|---|---|
| Console panel | `pkg/rancher-ai-ui/components/panels/Console.vue` |
| LLM model label | `pkg/rancher-ai-ui/components/console/LlmModelLabel.vue` |
| Verify results disclaimer | `pkg/rancher-ai-ui/components/console/VerifyResultsDisclaimer.vue` |
| TextLabel popover | `pkg/rancher-ai-ui/components/popover/TextLabel.vue` |
| Input composable | `pkg/rancher-ai-ui/composables/useInputComposable.ts` |

## Overview

The console feature is the primary input area of the AI chat panel. It consists of:

- A **textarea** for typing messages (`data-testid="rancher-ai-ui-chat-input-textarea"`)
- A **send button** (icon-send) that submits the current input
- A **recalled text overlay** (`.chat-input-complete`) that shows a suggestion when navigating prompt history
- An **LLM model label** (`.llm-model-label`) showing the active model
- A **verify results disclaimer** link (`.textlabel-popper .inline-button`) that opens a popover

### Key Behavioral Notes (from planner learnings)

- `{uparrow}` in the textarea (when input is empty) sets a `completeText` overlay —
  it does **not** change the textarea value directly; the overlay disappears only after Tab or a new keystroke.
- Pressing `{tab}` (with `{ force: true }`) accepts the recalled text and writes it into the textarea.
- Pressing `{downarrow}` when `historyIndex` is at 0 resets `historyIndex` to -1, clearing the overlay.
- Use `chunkSize: 1` (with long text) for tests that assert the console is disabled while the AI is processing.
- Message IDs are sequential: welcome message → ID 1; each subsequent message (user or AI) increments.

---

## Page Objects Needed

### Reuse Existing
- `ChatPo` (`@/cypress/e2e/po/chat.po`) — `open()`, `close()`, `isReady()`, `sendMessage()`, `getMessage()`
- `ConsolePo` (`@/cypress/e2e/po/console.po`) — `textarea()`, `sendMessage()`

### New Page Object: `ConsolePo` extensions (add to `console.po.ts`)

```typescript
// Methods to add to ConsolePo class

sendButton() {
  return this.self().find('.send-button');
}

recalledTextOverlay() {
  return this.self().find('.chat-input-complete .text');
}

llmModelLabel() {
  return cy.get('.llm-model-label');
}

disclaimerButton() {
  return cy.get('.textlabel-popper .inline-button').first();
}

disclaimerPopover() {
  return cy.get('.disclaimer');
}
```

---

## Custom Commands

| Command | Usage |
|---|---|
| `cy.login()` | Log in before each test |
| `cy.enqueueLLMResponse({ text, chunkSize })` | Queue mock AI response before sending a message |
| `cy.cleanChatHistory()` | Clear all chat history after each test |

---

## Mock Data

| Test | Mock response text | `chunkSize` |
|---|---|---|
| Test 1 (send via Enter) | `'Mock response to Enter send.'` | `30` |
| Test 2 (multi-line) | `'Mock response to multi-line.'` | `30` |
| Test 3 (send via button) | `'Mock response to button send.'` | `30` |
| Test 5 (disabled state) | A very long string (≥ 200 chars, see below) | `1` |
| Test 6 (prompt history) | Two responses for two messages | `30` |
| Test 7 (tab autocomplete) | One response for one message | `30` |

**Long text for Test 5** (use `chunkSize: 1` to ensure streaming is still in progress when assertions run):
```
'This is a very long AI response that will be streamed one character at a time to ensure the console is still in the disabled state while we test for it.'
```

---

## Test Cases

---

### Test 1: Send a message using the Enter key

**Description:** Verifies the primary send flow — typing into the textarea and pressing Enter submits
the message and receives an AI response.

**Preconditions:**
- Logged in
- Chat panel open and ready (`rancher-ai-ui-chat-panel-ready` exists)
- Welcome message already sent by AI (ID 1)
- One LLM response queued for the user message

**Message ID sequence:**
- ID 1 → AI welcome message (auto-sent on open)
- ID 2 → user message "Hello from Enter key"
- ID 3 → AI mock response

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Wait for welcome message: `chat.getMessage(1).isCompleted()`
4. `cy.enqueueLLMResponse({ text: 'Mock response to Enter send.', chunkSize: 30 })`
5. `cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('Hello from Enter key').type('{enter}')`

**Assertions:**
- User message box ID 2 exists and contains `'Hello from Enter key'`
- AI response box ID 3 exists and is completed (`isCompleted()`)
- AI response contains `'Mock response to Enter send.'`
- Textarea is empty after send

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`

**Screenshot:** `console-test-1-send-via-enter`

---

### Test 2: Add a newline with Shift+Enter (no send)

**Description:** Verifies that pressing Shift+Enter inserts a newline rather than sending the message.

**Preconditions:**
- Logged in
- Chat panel open and ready
- No queued LLM response needed (we verify no send occurs)

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Wait for welcome: `chat.getMessage(1).isCompleted()`
4. Type in textarea: `'First line{shift}{enter}Second line'` — do **not** press Enter alone

**Assertions:**
- Textarea value contains a newline: `should('contain.value', 'First line')`
- No user message box ID 2 exists (`should('not.exist')`) — no send occurred
- Textarea has multiple rows (height > initial) or `scrollHeight` is larger

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`

**Screenshot:** `console-test-2-shift-enter-newline`

---

### Test 3: Send a message via the send button

**Description:** Verifies clicking the send button (`.send-button`) submits the message.

**Preconditions:**
- Logged in
- Chat panel open and ready
- Welcome message (ID 1) already sent
- One LLM response queued

**Message ID sequence:**
- ID 1 → AI welcome message
- ID 2 → user message "Hello from button"
- ID 3 → AI mock response

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Wait: `chat.getMessage(1).isCompleted()`
4. `cy.enqueueLLMResponse({ text: 'Mock response to button send.', chunkSize: 30 })`
5. `cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('Hello from button')`
6. `cy.get('[data-testid="rancher-ai-ui-chat-console"]').find('.send-button').click()`

**Assertions:**
- Send button is disabled after input is cleared (and before the user typed)
- User message ID 2 contains `'Hello from button'`
- AI response ID 3 is completed and contains `'Mock response to button send.'`
- Textarea is empty after send

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-console"] .send-button`
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`

**Screenshot:** `console-test-3-send-via-button`

---

### Test 4: Send button is disabled when the textarea is empty

**Description:** Verifies the send button is disabled when the textarea is empty, and enabled once text
is entered.

**Preconditions:**
- Logged in
- Chat panel open and ready

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Check send button disabled state with empty textarea
4. Type a character into the textarea
5. Check send button enabled state
6. Clear the textarea
7. Check send button disabled again

**Assertions:**
- With empty input: `cy.get('[data-testid="rancher-ai-ui-chat-console"] .send-button').should('be.disabled')`
- After typing: `.send-button` should NOT be disabled
- After clearing: `.send-button` should be disabled again

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-console"] .send-button`

**Screenshot:** `console-test-4-send-button-state`

---

### Test 5: Console textarea is disabled while AI is processing

**Description:** Verifies that the textarea and send button become disabled while an AI response is
streaming, then re-enable once the response is complete.

**Implementation Notes:** Use `chunkSize: 1` with a long response (≥ 150 chars) so that the streaming
is still in progress when we assert the disabled state.

**Preconditions:**
- Logged in
- Chat panel open and ready
- Welcome message (ID 1) already completed

**Message ID sequence:**
- ID 1 → AI welcome message
- ID 2 → user message
- ID 3 → AI streaming response

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Wait: `chat.getMessage(1).isCompleted()`
4. `cy.enqueueLLMResponse({ text: '<150-char string>', chunkSize: 1 })`
5. `cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').type('Test disabled state').type('{enter}')`
6. Immediately (while streaming) assert disabled states

**Assertions (while streaming):**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]` should have attribute `disabled`
- `[data-testid="rancher-ai-ui-chat-console"] .send-button` should be disabled
- `[data-testid="rancher-ai-ui-chat-console"]` should have class `disabled-panel` on the inner wrapper
- After `chat.getMessage(3).isCompleted()`:
  - Textarea should NOT have attribute `disabled`
  - Send button should NOT be disabled

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-console"] .send-button`
- `[data-testid="rancher-ai-ui-chat-console"] .disabled-panel`

**Screenshot:** `console-test-5-disabled-during-processing`

---

### Test 6: Prompt history navigation with up and down arrows

**Description:** Verifies that pressing the up arrow in an empty textarea recalls previous user
messages, and down arrow navigates forward (eventually clearing the recalled text).

**Implementation Notes (from planner learnings):**
- `{uparrow}` shows a `.chat-input-complete .text` overlay (not the textarea value itself).
- The overlay text content equals the recalled user message.
- `{downarrow}` moves forward in history; when index reaches -1, the overlay disappears.

**Preconditions:**
- Logged in
- Chat panel open and ready
- Welcome message (ID 1) completed
- Two user messages sent; two AI responses received

**Message ID sequence:**
- ID 1 → AI welcome message
- ID 2 → user message "First history message"
- ID 3 → AI response 1
- ID 4 → user message "Second history message"
- ID 5 → AI response 2

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Wait: `chat.getMessage(1).isCompleted()`
4. Queue and send first message: `cy.enqueueLLMResponse({ text: 'Response 1', chunkSize: 30 })` → `chat.sendMessage('First history message')` → wait `chat.getMessage(3).isCompleted()`
5. Queue and send second message: `cy.enqueueLLMResponse({ text: 'Response 2', chunkSize: 30 })` → `chat.sendMessage('Second history message')` → wait `chat.getMessage(5).isCompleted()`
6. Ensure textarea is empty
7. Press `{uparrow}` in the textarea
8. Assert overlay shows `'Second history message'`
9. Press `{uparrow}` again
10. Assert overlay shows `'First history message'`
11. Press `{downarrow}`
12. Assert overlay shows `'Second history message'` again
13. Press `{downarrow}` again
14. Assert overlay is gone (`.chat-input-complete` does not exist or is empty)

**Assertions:**
- After first `{uparrow}`: `cy.get('.chat-input-complete .text').should('contain.text', 'Second history message')`
- After second `{uparrow}`: `cy.get('.chat-input-complete .text').should('contain.text', 'First history message')`
- After first `{downarrow}`: `cy.get('.chat-input-complete .text').should('contain.text', 'Second history message')`
- After second `{downarrow}`: `cy.get('.chat-input-complete').should('not.exist')`

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `.chat-input-complete .text`
- `.chat-input-complete`

**Screenshot:** `console-test-6-prompt-history-navigation`

---

### Test 7: Tab key accepts the recalled text into the textarea

**Description:** Verifies that pressing Tab when a recalled text overlay is shown accepts the suggestion
and places it in the textarea.

**Implementation Notes:**
- `{tab}` must be sent with `{ force: true }` because the textarea intercepts the Tab key.
- After Tab, `inputText` is updated and the overlay disappears.

**Preconditions:**
- Logged in
- Chat panel open and ready
- One message in history for recall (welcome message ID 1 completed, user message ID 2 sent)

**Message ID sequence:**
- ID 1 → AI welcome message
- ID 2 → user message "Tab test message"
- ID 3 → AI response

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. Wait: `chat.getMessage(1).isCompleted()`
4. `cy.enqueueLLMResponse({ text: 'Tab test response', chunkSize: 30 })` → `chat.sendMessage('Tab test message')` → wait `chat.getMessage(3).isCompleted()`
5. Ensure textarea is empty (it should be after send)
6. Press `{uparrow}` in textarea → overlay appears with `'Tab test message'`
7. Press `{tab}` with `{ force: true }` in textarea

**Assertions:**
- Before Tab: overlay `.chat-input-complete .text` contains `'Tab test message'`
- After Tab: `[data-testid="rancher-ai-ui-chat-input-textarea"]` has value containing `'Tab test message'`
- After Tab: overlay `.chat-input-complete` should not exist

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `.chat-input-complete .text`
- `.chat-input-complete`

**Screenshot:** `console-test-7-tab-autocomplete`

---

### Test 8: LLM model label is visible in the console footer

**Description:** Verifies that the LLM model label is shown in the console area below the textarea.

**Preconditions:**
- Logged in
- Chat panel open and ready

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`

**Assertions:**
- `cy.get('.llm-model-label')` should exist and be visible
- Label should not be empty (`.should('not.be.empty')` on its text)

**Selectors:**
- `.llm-model-label`

**Screenshot:** `console-test-8-llm-model-label`

---

### Test 9: Verify results disclaimer popover opens and shows content

**Description:** Verifies that clicking the "Verify Results" link in the console footer opens a popover
with the disclaimer content.

**Implementation Notes:**
- The trigger is `.textlabel-popper .inline-button` (from `TextLabel.vue`)
- The popover content is in a `.disclaimer` div containing disclaimer sections
- The popover is rendered via `RcDropdown`, so it may appear in a portal/overlay

**Preconditions:**
- Logged in
- Chat panel open and ready

**Steps:**
1. `cy.login()` → `HomePagePo.goTo()`
2. `chat.open()` → `chat.isReady()`
3. `cy.get('.textlabel-popper .inline-button').first().click()`

**Assertions:**
- Popover opens: `cy.get('.disclaimer').should('exist').and('be.visible')`
- Disclaimer contains at least one section title: `cy.get('.disclaimer-section-title').should('have.length.at.least', 1)`

**Selectors:**
- `.textlabel-popper .inline-button`
- `.disclaimer`
- `.disclaimer-section-title`

**Screenshot:** `console-test-9-disclaimer-popover`

---

## Implementation Notes

### `describe` / `it` Structure

```typescript
describe('Console', () => {
  const chat = new ChatPo();

  before(() => cy.login());
  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });
  afterEach(() => cy.cleanChatHistory());

  it('sends a message via Enter key', () => { /* Test 1 */ });
  it('adds a newline with Shift+Enter without sending', () => { /* Test 2 */ });
  it('sends a message via the send button', () => { /* Test 3 */ });
  it('disables send button when textarea is empty', () => { /* Test 4 */ });
  it('disables textarea while AI is processing', () => { /* Test 5 */ });
  it('navigates prompt history with up and down arrows', () => { /* Test 6 */ });
  it('accepts recalled text with Tab key', () => { /* Test 7 */ });
  it('shows the LLM model label in the console footer', () => { /* Test 8 */ });
  it('opens the verify results disclaimer popover', () => { /* Test 9 */ });
});
```

### Message ID Tracking

After `cy.cleanChatHistory()`, the chat resets. The welcome message is always ID 1. Document every
message that precedes the target in each test case — the planner learnings identify this as a
frequent source of bugs.

### chunkSize Guidance

| Scenario | `chunkSize` |
|---|---|
| Normal response (no timing dependency) | `30` |
| Disabled state during processing | `1` (ensures streaming is in progress during assertions) |

### Anti-Patterns to Avoid

- Do NOT use `chunkSize: 5` or higher for disabled-state tests (response may complete too fast)
- Do NOT describe `{uparrow}` as changing the textarea value — it changes the overlay, not the value
- Do NOT hardcode message IDs without listing the full preceding message sequence
- Do NOT use `.v-popper__inner` as the popover selector — prefer `.disclaimer`
