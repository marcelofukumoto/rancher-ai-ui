# Test Plan: Message Bubble Actions

**Feature Area**: `message-bubble-actions`  
**Date Created**: 2026-03-31  
**Spec File Location**: `cypress/e2e/tests/features/message-bubble-actions.spec.ts`

## Source Components Analyzed

| File | Role |
|------|------|
| `pkg/rancher-ai-ui/components/message/index.vue` | Main message component — renders bubble buttons (`chat-msg-bubble-actions`) for copy, resend, and thinking toggle |
| `pkg/rancher-ai-ui/components/message/BubbleButton.vue` | Reusable icon button rendered inside `.chat-msg-bubble-actions`; uses `.bubble-action-btn` class |
| `pkg/rancher-ai-ui/composables/useInputComposable.ts` | `cleanInputAndTags()` used by `handleCopy()` to clean clipboard text |
| `cypress/e2e/po/message.po.ts` | Existing page object with `thinkingButton()` and `containsText()` methods |
| `cypress/e2e/po/chat.po.ts` | `ChatPo` — used for `open()`, `isReady()`, `sendMessage()`, `getMessage()` |
| `cypress/support/commands/llm-mock-service-api.ts` | `cy.enqueueLLMResponse()` — used to queue mock AI responses |

## Key Component Behavior Notes

- **Bubble actions are always in the DOM** for non-disabled messages but start with `opacity: 0` and `pointer-events: none` via CSS
- **Hover reveals** bubble actions: `.chat-msg-bubble:hover .chat-msg-bubble-actions { opacity: 1; pointer-events: auto; }`
- **Thinking BubbleButton** (`data-testid="rancher-ai-ui-chat-message-show-thinking-button"`) only renders when role is `Assistant`, `thinkingContent` exists, and `!disabled`
- **Copy BubbleButton**: no `data-testid`; uses `.icon-copy` normally and `.icon-checkmark` for 1 second after a successful copy; uses tooltip "Copy to Clipboard" (from `ai.message.actions.tooltip.copy`)
- **Resend BubbleButton**: no `data-testid`; uses `.icon-backup`; tooltip "Resend Message"; only renders when role is `User` and no `pendingConfirmation`
- **Hide Thinking inline button**: an `RcButton` with class `.inline-button` that appears (v-if) only when `showThinking === true`; contains text "Hide Thinking" (from `ai.message.actions.hideThinking`)
- **Disabled state**: entire `.chat-msg-bubble-actions` div is `v-if="!props.disabled"` — it is **not rendered at all** when the panel is disabled during AI processing

## Message ID Sequence

After `cy.cleanChatHistory()`:
- `msgIdCnt` resets to `0`
- First AI message (welcome): **ID 1**
- First user message sent: **ID 2**
- First AI response to user: **ID 3**
- Second user message (e.g., after resend): **ID 4**
- Second AI response: **ID 5**

---

## Test Cases

### Test 1: Copy button is visible on hover over an AI message

**Description**: Verifies that the copy BubbleButton appears when the user hovers over a completed assistant message bubble and that it is not visible before hover.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) has been received and completed (from default LLM mock)

**Steps**:
1. Do NOT hover — verify `.chat-msg-bubble-actions` exists in DOM for message box 1 but is not interactable
2. Trigger `mouseenter` on `[data-testid="rancher-ai-ui-chat-message-box-1"] .chat-msg-bubble` to reveal bubble actions
3. Verify copy button is present

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-1"] .chat-msg-bubble-actions` exists (v-if rendered)
- After mouseenter, `.chat-msg-bubble-actions .bubble-action-btn .icon-copy` is present in DOM

**Selectors**:
- `rancher-ai-ui-chat-message-box-1` (message box)
- `.chat-msg-bubble` (trigger mouseenter here)
- `.chat-msg-bubble-actions` (action buttons container)
- `.bubble-action-btn .icon-copy` (copy icon)

**Screenshot**: `message-bubble-actions-test-1-copy-hover-visible`

---

### Test 2: Copy AI response — icon changes to checkmark on click

**Description**: Verifies that clicking the copy button on an AI message copies content and briefly shows a checkmark icon instead of the copy icon.

**Preconditions**:
1. User is logged in
2. Chat panel is open and `isReady()`
3. Welcome message (ID 1) received

**Mock Data**:
```typescript
cy.enqueueLLMResponse({ text: 'This is a copyable AI response.' });
```

**Steps**:
1. Enqueue LLM response
2. Send message: `"Copy this response"`
3. Wait for AI response message (ID 3) to complete via `chat.getMessage(3).isCompleted()`
4. Hover over `[data-testid="rancher-ai-ui-chat-message-box-3"] .chat-msg-bubble` using `trigger('mouseenter', { force: true })`
5. Click the copy button: `.chat-msg-bubble-actions .bubble-action-btn .icon-copy` (with `{ force: true }`)
6. Assert checkmark icon replaces copy icon

**Assertions**:
- Before click: `[data-testid="rancher-ai-ui-chat-message-box-3"] .bubble-action-btn .icon-copy` exists
- After click: `[data-testid="rancher-ai-ui-chat-message-box-3"] .bubble-action-btn .icon-checkmark` exists

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `.chat-msg-bubble`
- `.chat-msg-bubble-actions .bubble-action-btn .icon-copy`
- `.chat-msg-bubble-actions .bubble-action-btn .icon-checkmark`

**Screenshot**: `message-bubble-actions-test-2-copy-checkmark`

---

### Test 3: Copy icon reverts back after ~1 second

**Description**: Verifies that the checkmark icon shown after a successful copy reverts back to the copy icon after the 1-second timeout in `handleCopy()`.

**Preconditions**: Continuation of Test 2 (after clicking copy, `.icon-checkmark` is visible)

**Steps**:
1. Following Test 2 step 5 (copy button clicked, checkmark visible)
2. Wait 1500ms: `cy.wait(1500)`
3. Keep hover active on the message bubble

**Assertions**:
- After 1500ms: `[data-testid="rancher-ai-ui-chat-message-box-3"] .bubble-action-btn .icon-copy` exists again
- `.bubble-action-btn .icon-checkmark` no longer exists

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `.bubble-action-btn .icon-copy`
- `.bubble-action-btn .icon-checkmark`

**Screenshot**: `message-bubble-actions-test-3-copy-icon-reverts`

---

### Test 4: Copy button is also available on user messages

**Description**: Verifies that user messages also have a copy bubble button (the copy button is not exclusive to AI messages).

**Preconditions**:
1. Chat is open, `isReady()`
2. Welcome message (ID 1) received

**Mock Data**:
```typescript
cy.enqueueLLMResponse({ text: 'Acknowledged.' });
```

**Steps**:
1. Enqueue LLM response
2. Send message: `"Hello from user"`
3. Wait for user message (ID 2) to be displayed: `chat.getMessage(2).containsText('Hello from user')`
4. Hover over `[data-testid="rancher-ai-ui-chat-message-box-2"] .chat-msg-bubble` using `trigger('mouseenter', { force: true })`
5. Verify copy button is present on user message

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-2"] .bubble-action-btn .icon-copy` exists

**Selectors**:
- `rancher-ai-ui-chat-message-box-2`
- `.chat-msg-bubble`
- `.bubble-action-btn .icon-copy`

**Screenshot**: `message-bubble-actions-test-4-copy-user-message`

---

### Test 5: Resend button appears on user messages only

**Description**: Verifies that the resend bubble button (`.icon-backup`) appears on user message bubbles but NOT on AI assistant message bubbles. The resend button is rendered with `v-if="props.message.role === RoleEnum.User && !pendingConfirmation"`.

**Preconditions**:
1. Chat is open, `isReady()`
2. Welcome message (ID 1) received

**Mock Data**:
```typescript
cy.enqueueLLMResponse({ text: 'Got it.' });
```

**Steps**:
1. Enqueue LLM response
2. Send message: `"Test resend button visibility"`
3. Wait for AI response (ID 3) to complete
4. Hover over user message (ID 2): `trigger('mouseenter', { force: true })` on `.chat-msg-bubble` inside `[data-testid="rancher-ai-ui-chat-message-box-2"]`
5. Verify resend button exists on user message
6. Hover over AI message (ID 3): `trigger('mouseenter', { force: true })` on `.chat-msg-bubble` inside `[data-testid="rancher-ai-ui-chat-message-box-3"]`
7. Verify resend button does NOT exist on AI message

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-2"] .bubble-action-btn .icon-backup` exists
- `[data-testid="rancher-ai-ui-chat-message-box-3"] .bubble-action-btn .icon-backup` does not exist

**Selectors**:
- `rancher-ai-ui-chat-message-box-2`
- `rancher-ai-ui-chat-message-box-3`
- `.bubble-action-btn .icon-backup`

**Screenshot**: `message-bubble-actions-test-5-resend-button-user-only`

---

### Test 6: Resend user message triggers a new AI response

**Description**: Verifies that clicking the resend button on a user message re-submits it, causing the AI to produce another response (a new message appears in the chat).

**Preconditions**:
1. Chat is open, `isReady()`
2. Welcome message (ID 1) received

**Mock Data**:
```typescript
// First response
cy.enqueueLLMResponse({ text: 'First AI response.' });
// Second response (after resend)
cy.enqueueLLMResponse({ text: 'Second AI response after resend.' });
```

**Steps**:
1. Enqueue first LLM response
2. Send message: `"Resend me"`
3. Wait for AI response (ID 3) to complete: `chat.getMessage(3).isCompleted()`
4. Enqueue second LLM response
5. Hover over user message (ID 2) and trigger resend: hover `.chat-msg-bubble` in `[data-testid="rancher-ai-ui-chat-message-box-2"]`, then click `.bubble-action-btn .icon-backup` with `{ force: true }`
6. Wait for second user message (ID 4) and second AI response (ID 5)

**Assertions**:
- `chat.getMessage(3).containsText('First AI response.')`
- After resend: `chat.getMessage(4).containsText('Resend me')` (message text reused)
- `chat.getMessage(5).containsText('Second AI response after resend.')`

**Message ID Sequence**:
- ID 1: Welcome AI message
- ID 2: User "Resend me"
- ID 3: First AI response
- ID 4: User "Resend me" (resent — same text as ID 2)
- ID 5: Second AI response

**Selectors**:
- `rancher-ai-ui-chat-message-box-2`
- `.chat-msg-bubble`
- `.bubble-action-btn .icon-backup`
- `rancher-ai-ui-chat-message-box-4`
- `rancher-ai-ui-chat-message-box-5`

**Screenshot**: `message-bubble-actions-test-6-resend-new-ai-response`

---

### Test 7: Show thinking content via thinking toggle button (after processing completes)

**Description**: Verifies that after an AI message with thinking content has **completed** processing, the thinking toggle BubbleButton is still available and can show the thinking content on demand.

This is distinct from the existing "Show thinking phase" test in `message.spec.ts`, which clicks the thinking button during active processing. This test confirms the toggle works on a **completed** message.

**Preconditions**:
1. Chat is open, `isReady()`
2. Welcome message (ID 1) received

**Mock Data**:
```typescript
cy.enqueueLLMResponse({
  text: [
    '<think>Internal reasoning: the answer is 42.</think>',
    'The answer is 42.',
  ],
  chunkSize: 15
});
```

**Steps**:
1. Enqueue LLM response with thinking tags
2. Send message: `"What is the answer?"`
3. Wait for AI response (ID 3) to complete: `chat.getMessage(3).isCompleted()`
4. Confirm thinking content is NOT visible yet (default `showThinking` is false)
5. Hover over AI message (ID 3) bubble: `trigger('mouseenter', { force: true })` on `.chat-msg-bubble` inside `[data-testid="rancher-ai-ui-chat-message-box-3"]`
6. Click thinking button: `[data-testid="rancher-ai-ui-chat-message-show-thinking-button"]` with `{ force: true }`
7. Verify thinking content is visible in the message bubble

**Assertions**:
- Before click: `chat.getMessage(3).content()` does NOT contain "Internal reasoning"
- After click: `chat.getMessage(3).containsText('Internal reasoning: the answer is 42.')`
- `chat.getMessage(3).containsText('The answer is 42.')`

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `.chat-msg-bubble`
- `rancher-ai-ui-chat-message-show-thinking-button`
- `rancher-ai-ui-chat-message-formatted-content` (for final response text)

**Screenshot**: `message-bubble-actions-test-7-thinking-show-completed`

---

### Test 8: Hide thinking content via inline "Hide Thinking" button

**Description**: Verifies that after clicking the thinking toggle button to show thinking content, the inline "Hide Thinking" `RcButton` appears and clicking it collapses the thinking content.

The inline "Hide Thinking" button (class `.inline-button`) is rendered with `v-if="props.message.role === RoleEnum.Assistant && !!props.message.thinkingContent && props.message.showThinking"`.

**Preconditions**: Same as Test 7 — start with a completed AI message that has thinking content, and thinking is already shown (following Test 7 step 6 or set up independently)

**Mock Data** (same as Test 7):
```typescript
cy.enqueueLLMResponse({
  text: [
    '<think>Internal reasoning: the answer is 42.</think>',
    'The answer is 42.',
  ],
  chunkSize: 15
});
```

**Steps** (set up from scratch):
1. Enqueue LLM response with thinking tags
2. Send message: `"What is the answer?"`
3. Wait for AI response (ID 3) to complete
4. Hover and click the thinking button to show thinking content (same as Test 7 steps 5–6)
5. Verify thinking content visible: `cy.contains('Internal reasoning: the answer is 42.')`
6. Click inline "Hide Thinking" button: `cy.contains('Hide Thinking').click({ force: true })`
7. Verify thinking content is no longer visible

**Assertions**:
- After clicking "Hide Thinking": `chat.getMessage(3).content()` does NOT contain "Internal reasoning"
- `chat.getMessage(3).containsText('The answer is 42.')` (final response still visible)
- The "Hide Thinking" button itself is no longer visible (v-if condition becomes false)

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `.chat-msg-bubble`
- `rancher-ai-ui-chat-message-show-thinking-button`
- `.inline-button` (contains text "Hide Thinking")
- `rancher-ai-ui-chat-message-formatted-content`

**Screenshot**: `message-bubble-actions-test-8-thinking-hide`

---

### Test 9: Bubble actions div is not rendered while AI is actively processing

**Description**: Verifies that the `.chat-msg-bubble-actions` container is completely absent from the DOM for a message while it is in a disabled/processing state, since it is gated by `v-if="!props.disabled"`.

This uses `chunkSize: 1` with long text to ensure the AI response is slow enough for timing-based assertions.

**Preconditions**:
1. Chat is open, `isReady()`
2. Welcome message (ID 1) received

**Mock Data**:
```typescript
cy.enqueueLLMResponse({
  text: 'Processing slowly word by word for testing disabled state visibility.',
  chunkSize: 1
});
```

**Steps**:
1. Enqueue LLM response with `chunkSize: 1`
2. Send message: `"Slow response test"`
3. Immediately check that the welcome message (ID 1) no longer has `.chat-msg-bubble-actions` in DOM (panel is disabled during AI processing)
4. Wait for AI response (ID 3) to complete
5. After completion, verify bubble actions are restored

**Assertions**:
- While processing: `[data-testid="rancher-ai-ui-chat-message-box-1"] .chat-msg-bubble-actions` should not exist (panel disabled, `v-if="!disabled"`)
- After completion: `[data-testid="rancher-ai-ui-chat-message-box-1"] .chat-msg-bubble-actions` exists again

**Selectors**:
- `rancher-ai-ui-chat-message-box-1`
- `.chat-msg-bubble-actions`

**Implementation Notes**:
- Use `chunkSize: 1` to ensure slow enough processing for assertion timing
- The `disabled` prop flows from `Chat.vue` through `Messages.vue` to each `Message` component
- Only check the bubble-actions `v-if` absence — do not check opacity since opacity is CSS-only

**Screenshot**: `message-bubble-actions-test-9-disabled-no-bubble-actions`

---

## Page Objects Needed

### New PO: `MessageBubbleActionsPo` (optional extension of existing `MessagePo`)

The existing `MessagePo` in `cypress/e2e/po/message.po.ts` can be extended via `RawMessagePo` with new methods. Alternatively, interact directly using selectors.

**Methods to add** (if extending `RawMessagePo`):

```typescript
copyButton() {
  this.self().trigger('mouseenter', { force: true });
  return this.self().find('.bubble-action-btn .icon-copy');
}

copyButtonSuccess() {
  return this.self().find('.bubble-action-btn .icon-checkmark');
}

resendButton() {
  this.self().trigger('mouseenter', { force: true });
  return this.self().find('.bubble-action-btn .icon-backup');
}

hasBubbleActions() {
  return this.self().find('.chat-msg-bubble-actions');
}
```

### Existing POs to Reuse

| PO | Usage |
|----|-------|
| `ChatPo` | `open()`, `isReady()`, `sendMessage()`, `getMessage()`, `close()` |
| `MessagePo` | `containsText()`, `isCompleted()`, `thinkingButton()`, `content()` |

---

## Custom Commands

| Command | Usage |
|---------|-------|
| `cy.login()` | Authentication |
| `cy.enqueueLLMResponse({ text, chunkSize })` | Mock AI responses |
| `cy.cleanChatHistory()` | Clean chat state between tests |

---

## Mock Data Summary

| Test | Mock Text | chunkSize | Notes |
|------|-----------|-----------|-------|
| Test 2 | `'This is a copyable AI response.'` | default | Simple completion |
| Test 4 | `'Acknowledged.'` | default | Simple completion |
| Test 5 | `'Got it.'` | default | Simple completion |
| Test 6 | `'First AI response.'` + `'Second AI response after resend.'` | default | Two enqueued responses |
| Test 7 | `'<think>...</think>The answer is 42.'` | 15 | Thinking content test |
| Test 8 | `'<think>...</think>The answer is 42.'` | 15 | Same as Test 7 |
| Test 9 | Long sentence | **1** | Forces slow processing for timing |

---

## Anti-Patterns to Avoid

- **Do NOT** assert that `opacity: 0` means the button is hidden — use `v-if` absence instead (bubble actions div is `v-if="!disabled"` during processing)
- **Do NOT** check clipboard content directly — clipboard API access is restricted in Cypress; instead assert the icon change (copy → checkmark)
- **Do NOT** use `{ force: true }` on hover (`trigger('mouseenter')`) without including it — the button starts at `opacity: 0` / `pointer-events: none`
- **Do NOT** click copy/resend without first triggering `mouseenter` on `.chat-msg-bubble` — the CSS only makes buttons clickable on hover
- **Do NOT** reference `rancher-ai-ui-chat-message-show-thinking-button` for the inline hide button — these are separate elements: BubbleButton (show) vs RcButton `.inline-button` (hide)
- **Do NOT** hardcode message IDs without documenting the full message sequence in preconditions

## Spec File Location

```
cypress/e2e/tests/features/message-bubble-actions.spec.ts
```
