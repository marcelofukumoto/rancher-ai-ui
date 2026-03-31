# E2E Test Plan: Console Panel

**Feature Area**: `console`
**Date Created**: 2026-03-31
**Spec File Location**: `cypress/e2e/tests/features/console.spec.ts`

## Source Components Analyzed

| Source File | Role |
|-------------|------|
| `components/panels/Console.vue` | Main console panel: input area, prompt history, send button, agent selector, footer info |
| `components/console/LlmModelLabel.vue` | Displays the active LLM configuration name and model in the console footer |
| `components/console/VerifyResultsDisclaimer.vue` | "Verify results" clickable label that opens a disclaimer popover |
| `components/popover/TextLabel.vue` | Popover trigger/wrapper used by `VerifyResultsDisclaimer` and `KeyboardShortcuts` |
| `composables/useInputComposable.ts` | Manages textarea input state, `updateInput`, `cleanInput`, `cleanInputAndTags` |

---

## Test Cases

### Test 1: Prompt history — up arrow recalls last user message

**Description**: Verifies that pressing the up-arrow key in an empty textarea fills it with the most recent user message.

**Preconditions**:
- User is logged in
- Chat is open and ready (`rancher-ai-ui-chat-panel-ready`)
- At least one user message has been sent in the current chat

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Enqueue an LLM response and send a user message (e.g. `"Hello from history test"`).
4. Wait for the AI response to complete.
5. Focus the textarea (`rancher-ai-ui-chat-input-textarea`) and confirm it is empty.
6. Press `{uparrow}` in the textarea.

**Assertions**:
- The textarea value becomes `"Hello from history test"`.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot**: `console-test-1-prompt-history-up-arrow`

---

### Test 2: Prompt history — down arrow clears the recalled message

**Description**: Verifies that after navigating up in history, pressing down arrow returns the textarea to empty.

**Preconditions**:
- Same as Test 1; one user message has been sent.

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Enqueue an LLM response and send a user message (e.g. `"First message"`).
4. Wait for the AI response to complete.
5. Press `{uparrow}` in the textarea to recall the message.
6. Press `{downarrow}` in the textarea.

**Assertions**:
- The textarea value becomes empty (no `value` attribute / empty string).

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot**: `console-test-2-prompt-history-down-arrow`

---

### Test 3: Prompt history — navigates multiple previous messages in order

**Description**: Verifies that repeated up-arrow presses cycle through older messages, and the order is newest-first.

**Preconditions**:
- User is logged in, chat is open and ready.
- Two user messages have been sent: `"Message A"` then `"Message B"`.

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Enqueue LLM responses and send `"Message A"`, wait for AI reply, then send `"Message B"`, wait for AI reply.
4. In the textarea, press `{uparrow}` once.
5. Note the value.
6. Press `{uparrow}` again.

**Assertions**:
- After first up arrow: textarea value is `"Message B"` (most recent).
- After second up arrow: textarea value is `"Message A"` (older).

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot**: `console-test-3-prompt-history-multiple-messages`

---

### Test 4: Tab autocomplete fills textarea with prompt suggestion

**Description**: Verifies that when prompt history is recalled (completeText is shown as a ghost suggestion), pressing Tab fills the textarea with that suggestion.

**Preconditions**:
- User is logged in, chat is open and ready.
- At least one user message has been sent.

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Enqueue an LLM response and send `"Tab autocomplete test message"`.
4. Wait for the AI response to complete.
5. Press `{uparrow}` in the textarea to load prompt history suggestion.
6. Verify the suggestion ghost text appears (the textarea should show the suggestion).
7. Press `{tab}` with `{ force: true }` inside the textarea.

**Assertions**:
- After `{tab}`: the textarea value equals `"Tab autocomplete test message"`.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot**: `console-test-4-tab-autocomplete`

---

### Test 5: Enter key sends a message; Shift+Enter adds a newline

**Description**: Verifies that Enter submits the message and Shift+Enter inserts a newline instead.

**Preconditions**:
- User is logged in, chat is open and ready.

**Steps** (Enter to send):
1. Navigate to Home page.
2. Open chat.
3. Wait for welcome message to complete.
4. Enqueue an LLM response.
5. Type `"Send on Enter"` in the textarea.
6. Press `{enter}` (no shift).

**Steps** (Shift+Enter for newline):
7. Type `"Line 1"` in the textarea.
8. Press `{shift}{enter}`.
9. Type `"Line 2"`.
10. Verify the textarea value contains a newline between the two lines.

**Assertions**:
- After step 6: a new user message `"Send on Enter"` appears in the chat (message index 2).
- After step 10: textarea value contains `"Line 1\nLine 2"` (not sent yet).

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`

**Screenshot**: `console-test-5-enter-send-vs-newline`

---

### Test 6: Console is disabled while AI is processing

**Description**: Verifies that the textarea and send button are disabled (grayed out) while the AI is generating a response.

**Preconditions**:
- User is logged in, chat is open and ready.
- LLM response is enqueued with a delayed/chunked delivery.

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Wait for welcome message to complete.
4. Enqueue a chunked LLM response (e.g. `chunkSize: 5`, large text).
5. Send a message to trigger processing.
6. Immediately (before response completes) inspect the textarea.

**Assertions**:
- The textarea has the `disabled` attribute while the AI is responding.
- After the response completes, the textarea no longer has `disabled`.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`

**Screenshot**: `console-test-6-disabled-while-processing`

---

### Test 7: LLM model label is visible in the console footer

**Description**: Verifies that the LLM model name label is shown in the console footer when the chat is connected.

**Preconditions**:
- User is logged in, chat is open and ready.
- The LLM config is active (default Ollama config is set up by the test environment).

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Verify the console footer is visible inside `rancher-ai-ui-chat-console`.

**Assertions**:
- The console contains a visible element with the LLM model name (`.llm-model-label` or text matching the configured model label pattern).

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-console"]`
- `.llm-model-label` (fallback CSS selector — no data-testid on this element)

**Screenshot**: `console-test-7-llm-model-label`

---

### Test 8: "Verify results" disclaimer popover opens on click

**Description**: Verifies that clicking the "Verify results" link in the console footer opens a disclaimer popover with three sections.

**Preconditions**:
- User is logged in, chat is open and ready.

**Steps**:
1. Navigate to Home page.
2. Open chat.
3. Wait for welcome message to complete.
4. In the console footer area, find the "Verify results" text/link.
5. Click it.

**Assertions**:
- A popover appears containing the disclaimer text for all three sections (AI limitations, accuracy, and suggestions to verify).
- The popover is visible and not hidden.

**Selectors**:
- `[data-testid="rancher-ai-ui-chat-console"]`
- `.textlabel-popper .inline-button` (CSS selector for the clickable label — no data-testid on this element)
- `.v-popper__inner` or `.disclaimer` (popover content container)

**Screenshot**: `console-test-8-verify-results-disclaimer`

---

## Page Objects Needed

### New PO: `ConsolePo` — already exists at `cypress/e2e/po/console.po.ts`

The existing `ConsolePo` should be extended with:

```typescript
// Additions to ConsolePo
promptHistory(direction: 'prev' | 'next') {
  if (direction === 'prev') {
    this.textarea().type('{uparrow}');
  } else {
    this.textarea().type('{downarrow}');
  }
}

acceptSuggestion() {
  this.textarea().type('{tab}', { force: true });
}

llmModelLabel() {
  return this.self().find('.llm-model-label');
}

verifyResultsLink() {
  return this.self().find('.textlabel-popper .inline-button');
}
```

### Existing POs to Reuse

| PO | Import Path | Usage |
|----|-------------|-------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | Open/close chat, access messages, console |
| `ConsolePo` | `@/cypress/e2e/po/console.po` | Textarea, sendMessage |
| `MessagePo` | `@/cypress/e2e/po/message.po` | Verify message content, `isCompleted()` |

---

## Custom Commands

| Command | Usage |
|---------|-------|
| `cy.login()` | Log in before each test |
| `cy.enqueueLLMResponse({ text, chunkSize? })` | Queue mock AI replies |
| `cy.cleanChatHistory()` | Clear all history in `before` block |

---

## Mock Data

| Test | Mock Response |
|------|---------------|
| Tests 1–4 | `{ text: '<message text>' }` (simple single-chunk response) |
| Test 5 | `{ text: 'Response to send-on-enter test' }` |
| Test 6 | `{ text: 'A long response to slow down delivery...', chunkSize: 2 }` |
| Tests 7–8 | No LLM response needed (visual-only assertions) |

---

## Spec File Location

```
cypress/e2e/tests/features/console.spec.ts
```

---

## Implementation Notes

1. **No new data-testids required**: All console interactions use the existing `rancher-ai-ui-chat-console` and `rancher-ai-ui-chat-input-textarea` selectors. LlmModelLabel and VerifyResultsDisclaimer do not have `data-testid` attributes and rely on CSS class selectors (`.llm-model-label`, `.textlabel-popper .inline-button`).

2. **Prompt history tests** depend on the `useInputComposable` storing messages and the `handleTextareaKeydown` handler in `Console.vue`. The textarea must be empty (`inputText.value === ''`) for arrow keys to trigger history navigation — tests must not have leftover text in the textarea.

3. **Tab autocomplete** requires the ghost suggestion to be visible (i.e., after pressing up-arrow to load a previous message). The `{ force: true }` flag is needed because the Tab key is normally intercepted by Cypress's focus management.

4. **Disabled state** (Test 6) requires sending a message with a `chunkSize` slow enough that the test can assert `disabled` before the response finishes. Use `chunkSize: 1` and a long text string for reliable timing, combined with `cy.get(...).should('have.attr', 'disabled')`.
