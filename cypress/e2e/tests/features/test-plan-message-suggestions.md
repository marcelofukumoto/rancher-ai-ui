# Test Plan: Message Suggestions

**Feature Area:** `message-suggestions`
**Date Created:** 2026-03-31
**Spec File Location:** `cypress/e2e/tests/features/message-suggestions.spec.ts`

## Source Components Analyzed

| File | Role |
|------|------|
| `pkg/rancher-ai-ui/components/message/Suggestions.vue` | Renders clickable suggestion chips; emits `select` with suggestion text |
| `pkg/rancher-ai-ui/components/message/index.vue` | Passes `suggestionActions` and `disabled` state to Suggestions; emits `send:message` on chip click |
| `pkg/rancher-ai-ui/utils/format.ts` | Parses `<suggestion>…</suggestion>` tags from AI response text into `suggestionActions` string array |
| `pkg/rancher-ai-ui/composables/useChatMessageComposable.ts` | `sendMessage()` is called on suggestion click; sets `MessagePhase.Processing` while waiting for AI response |
| `cypress/e2e/po/chat.po.ts` | `chat.getMessage(id)` returns `MessagePo`; `MessagePo.suggestion(index)` targets the chip |
| `cypress/e2e/po/message.po.ts` | `suggestion(index)` → `[data-testid="rancher-ai-ui-chat-message-suggestion-${index}"]`; `containsText()`, `isCompleted()` |
| `cypress/e2e/po/console.po.ts` | `textarea()` → `[data-testid="rancher-ai-ui-chat-input-textarea"]` |

---

## Message ID Behavior

After `cy.cleanChatHistory()` the `msgIdCnt` counter resets to `0`. IDs are assigned as:

| Sequence | Role | ID |
|----------|------|----|
| First message when chat opens | AI welcome message | 1 |
| User message from suggestion click | User | 2 |
| AI response to suggestion | AI | 3 |
| Second user message (if another suggestion click) | User | 4 |
| Second AI response | AI | 5 |

---

## Test Cases

### Test 1: Welcome message displays suggestion chips

**Description:** Verifies that when the AI welcome response contains `<suggestion>` tags, the corresponding chip buttons are rendered in the message with correct text.

**Preconditions:**
- Clean chat history (via `beforeEach` → `cy.cleanChatHistory()` from `afterEach`)
- Queue a single LLM response containing 3 suggestion tags before opening the chat

**Mock Data:**
```typescript
cy.enqueueLLMResponse({
  text:      "I'm Liz, your AI assistant! <suggestion>View resources</suggestion><suggestion>Analyze logs</suggestion><suggestion>Get help</suggestion>",
  chunkSize: 30,
});
```

**Steps:**
1. Call `cy.enqueueLLMResponse(...)` as above
2. `chat.open()` — triggers the welcome message request
3. `chat.isReady()` — wait for WebSocket to be ready
4. `chat.getMessage(1).isCompleted()` — wait for welcome message to finish streaming

**Assertions:**
- `chat.getMessage(1).suggestion(0)` exists and contains text `'View resources'`
- `chat.getMessage(1).suggestion(1)` exists and contains text `'Analyze logs'`
- `chat.getMessage(1).suggestion(2)` exists and contains text `'Get help'`

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-0`
- `rancher-ai-ui-chat-message-suggestion-1`
- `rancher-ai-ui-chat-message-suggestion-2`

**Screenshot:** `message-suggestions-test-1-suggestion-chips`

---

### Test 2: Clicking suggestion[0] sends its text as a user message

**Description:** Verifies that clicking the first suggestion chip creates a user message with exactly the suggestion's text, without requiring the user to type anything in the textarea.

**Preconditions:**
- Queue two LLM responses before opening the chat:
  1. Welcome response with suggestions
  2. AI reply for when the suggestion is sent

**Mock Data:**
```typescript
// Response 1: welcome with suggestions
cy.enqueueLLMResponse({
  text:      "How can I help? <suggestion>View resources</suggestion><suggestion>Analyze logs</suggestion>",
  chunkSize: 30,
});
// Response 2: AI reply after suggestion click
cy.enqueueLLMResponse({
  text: 'Here is your resource overview.',
});
```

**Steps:**
1. Enqueue both responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()` — wait for welcome message
4. `chat.getMessage(1).suggestion(0).click()` — click first suggestion chip
5. Wait for `chat.getMessage(2)` to appear

**Assertions:**
- `chat.getMessage(2).containsText('View resources')` — user message contains exact suggestion text

**Message ID Sequence:**
- ID 1: AI welcome message (with suggestion chips)
- ID 2: User message (content = first suggestion text)

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-0`
- `rancher-ai-ui-chat-message-box-2`

**Screenshot:** `message-suggestions-test-2-suggestion-sent`

---

### Test 3: AI responds after suggestion click

**Description:** Verifies that after a suggestion chip triggers a user message, the AI sends a follow-up response that completes normally.

**Preconditions:**
- Queue two LLM responses (welcome with suggestions, then AI reply)

**Mock Data:**
```typescript
cy.enqueueLLMResponse({
  text:      "Ready to assist! <suggestion>View resources</suggestion><suggestion>Analyze logs</suggestion>",
  chunkSize: 20,
});
cy.enqueueLLMResponse({
  text:      'Here are the resources you requested.',
  chunkSize: 10,
});
```

**Steps:**
1. Enqueue both responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()`
4. `chat.getMessage(1).suggestion(0).click()`
5. `chat.getMessage(2).containsText('View resources')`
6. `chat.getMessage(3).isCompleted()`

**Assertions:**
- `chat.getMessage(3).containsText('Here are the resources you requested.')`
- `chat.getMessage(3).isCompleted()`

**Message ID Sequence:**
- ID 1: AI welcome (with suggestions)
- ID 2: User message (from suggestion click)
- ID 3: AI response

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-0`
- `rancher-ai-ui-chat-message-box-2`
- `rancher-ai-ui-chat-message-box-3`

**Screenshot:** `message-suggestions-test-3-ai-response`

---

### Test 4: Clicking suggestion[1] sends the second suggestion text

**Description:** Verifies that the suggestion chip at index 1 (not just index 0) correctly sends its own text as the user message. Validates the index-based selector `rancher-ai-ui-chat-message-suggestion-1`.

**Preconditions:**
- Queue two LLM responses (welcome with suggestions, then AI reply)

**Mock Data:**
```typescript
cy.enqueueLLMResponse({
  text:      "Let me help! <suggestion>View resources</suggestion><suggestion>Analyze logs</suggestion><suggestion>Get help</suggestion>",
  chunkSize: 20,
});
cy.enqueueLLMResponse({
  text: 'Log analysis started.',
});
```

**Steps:**
1. Enqueue both responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()`
4. `chat.getMessage(1).suggestion(1).click()` — click SECOND chip (index 1)
5. Wait for message ID 2

**Assertions:**
- `chat.getMessage(2).containsText('Analyze logs')` — second suggestion text was sent, not first

**Message ID Sequence:**
- ID 1: AI welcome (3 suggestion chips)
- ID 2: User message (text = `'Analyze logs'`, from suggestion[1])

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-1`
- `rancher-ai-ui-chat-message-box-2`

**Screenshot:** `message-suggestions-test-4-second-suggestion`

---

### Test 5: Console textarea is empty after suggestion click

**Description:** Verifies that clicking a suggestion chip does NOT pre-fill the textarea — the message is sent directly without going through the console input.

**Preconditions:**
- Queue welcome response with suggestions + AI reply

**Mock Data:**
```typescript
cy.enqueueLLMResponse({
  text:      "Ready! <suggestion>View resources</suggestion>",
  chunkSize: 20,
});
cy.enqueueLLMResponse({ text: 'Resources loaded.' });
```

**Steps:**
1. Enqueue both responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()`
4. `chat.getMessage(1).suggestion(0).click()`
5. `chat.getMessage(2)` — wait for user message to appear

**Assertions:**
- `cy.get('[data-testid="rancher-ai-ui-chat-input-textarea"]').should('have.value', '')` — textarea is empty after suggestion click

**Message ID Sequence:**
- ID 1: AI welcome (with suggestion)
- ID 2: User message (from suggestion click)

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-0`
- `rancher-ai-ui-chat-input-textarea`

**Screenshot:** `message-suggestions-test-5-textarea-empty`

---

### Test 6: Suggestion buttons are disabled while AI is processing

**Description:** Verifies that after clicking a suggestion chip (triggering AI processing), the remaining suggestion chips in the welcome message are disabled and cannot be clicked.

**Preconditions:**
- Queue welcome response with 3 suggestions
- Queue AI reply with `chunkSize: 1` and long text to hold the processing state

**Mock Data:**
```typescript
cy.enqueueLLMResponse({
  text:      "Ready! <suggestion>View resources</suggestion><suggestion>Analyze logs</suggestion><suggestion>Get help</suggestion>",
  chunkSize: 10,
});
cy.enqueueLLMResponse({
  text:      'Processing your request. Please wait while I gather the information you need. This may take a moment.',
  chunkSize: 1,
});
```

**Steps:**
1. Enqueue both responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()`
4. `chat.getMessage(1).suggestion(0).click()` — trigger AI processing
5. Before the AI response completes (chunkSize: 1 ensures slow streaming), check suggestion button state

**Assertions:**
- `chat.getMessage(1).suggestion(1)` should have attribute `disabled` (button is disabled during processing)
- `chat.getMessage(1).suggestion(2)` should have attribute `disabled`

**Message ID Sequence:**
- ID 1: AI welcome (3 suggestion chips)
- ID 2: User message (from suggestion[0] click)
- ID 3: AI response (slow streaming — chunkSize: 1)

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-0`
- `rancher-ai-ui-chat-message-suggestion-1`
- `rancher-ai-ui-chat-message-suggestion-2`

**Screenshot:** `message-suggestions-test-6-disabled-state`

---

### Test 7: No suggestion chips on AI messages without suggestion tags

**Description:** Verifies that when an AI response does not contain `<suggestion>` tags, no suggestion chips are rendered in that message.

**Preconditions:**
- Queue a welcome response **without** any `<suggestion>` tags
- Queue a plain AI response without suggestion tags

**Mock Data:**
```typescript
// Welcome: no suggestions
cy.enqueueLLMResponse({
  text:      "Hello! How can I help you today?",
  chunkSize: 10,
});
// Follow-up: also no suggestions
cy.enqueueLLMResponse({
  text: 'Noted. Let me check that for you.',
});
```

**Steps:**
1. Enqueue both responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()`
4. `chat.sendMessage('Can you check my deployments?')`
5. `chat.getMessage(2).containsText('Can you check my deployments?')`
6. `chat.getMessage(3).isCompleted()`

**Assertions:**
- `chat.getMessage(1).suggestion(0)` does **not** exist in the DOM
- `chat.getMessage(3).suggestion(0)` does **not** exist in the DOM

**Message ID Sequence:**
- ID 1: AI welcome (no suggestions)
- ID 2: User message
- ID 3: AI response (no suggestions)

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-suggestion-0` (asserted as not existing)
- `rancher-ai-ui-chat-message-box-3`

**Screenshot:** `message-suggestions-test-7-no-suggestions`

---

### Test 8: Suggestion chips in a mid-conversation AI message can also be clicked

**Description:** Verifies that suggestion chips are not exclusive to the welcome message — an AI response in the middle of a conversation can also include suggestions, and clicking them sends the correct user message.

**Preconditions:**
- Queue 3 LLM responses: welcome (no suggestions), first AI reply with suggestions, second AI reply

**Mock Data:**
```typescript
// Welcome: no suggestions
cy.enqueueLLMResponse({ text: "Hello! How can I help you today?" });
// First AI reply: includes suggestions
cy.enqueueLLMResponse({
  text:      "Here is an overview. <suggestion>Show namespaces</suggestion><suggestion>List pods</suggestion>",
  chunkSize: 15,
});
// Second AI reply: plain
cy.enqueueLLMResponse({ text: 'Here is the namespace list.' });
```

**Steps:**
1. Enqueue all 3 responses
2. `chat.open()`
3. `chat.getMessage(1).isCompleted()` — welcome (no suggestions)
4. `chat.sendMessage('Show me an overview')`
5. `chat.getMessage(2).containsText('Show me an overview')` — user message
6. `chat.getMessage(3).isCompleted()` — AI reply with suggestions
7. `chat.getMessage(3).suggestion(0).click()` — click first suggestion in mid-conversation message
8. `chat.getMessage(4).containsText('Show namespaces')` — user message from mid-conversation suggestion

**Assertions:**
- `chat.getMessage(3).suggestion(0)` exists and contains text `'Show namespaces'`
- `chat.getMessage(3).suggestion(1)` exists and contains text `'List pods'`
- `chat.getMessage(4).containsText('Show namespaces')` — correct suggestion text sent

**Message ID Sequence:**
- ID 1: AI welcome (no suggestions)
- ID 2: User message (`'Show me an overview'`)
- ID 3: AI response (2 suggestion chips)
- ID 4: User message (from suggestion[0] click in ID 3)

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `rancher-ai-ui-chat-message-box-2`
- `rancher-ai-ui-chat-message-box-3`
- `rancher-ai-ui-chat-message-suggestion-0`
- `rancher-ai-ui-chat-message-suggestion-1`
- `rancher-ai-ui-chat-message-box-4`

**Screenshot:** `message-suggestions-test-8-mid-conversation-suggestion`

---

## Page Objects Needed

### Existing POs (reuse)
| PO | Import | Methods Used |
|----|--------|--------------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | `open()`, `close()`, `isReady()`, `sendMessage(text)`, `getMessage(id)` |
| `MessagePo` | via `ChatPo.getMessage()` | `suggestion(index)`, `containsText(text)`, `isCompleted()` |
| `ConsolePo` | via `ChatPo.console()` | `textarea()` |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | `goTo()` |

### New POs Needed
None. The existing `MessagePo.suggestion(index)` method is sufficient.

---

## Custom Commands

| Command | Description | Used In |
|---------|-------------|---------|
| `cy.login()` | Log into Rancher | `beforeEach` |
| `cy.enqueueLLMResponse({ text, chunkSize? })` | Queue a mock AI response | All tests |
| `cy.cleanChatHistory()` | Clear all chat history | `afterEach` |
| `cy.clearLLMResponses()` | Clear queued mock responses | `after` (safety cleanup) |

---

## Mock Data Summary

| Test | Responses Queued | Notes |
|------|-----------------|-------|
| 1 | 1 (welcome with 3 suggestions) | 3 `<suggestion>` tags |
| 2 | 2 (welcome with suggestions + AI reply) | Pre-queue before `chat.open()` |
| 3 | 2 (welcome with suggestions + AI reply) | Verify both user and AI messages |
| 4 | 2 (welcome with suggestions + AI reply) | Click suggestion[1] specifically |
| 5 | 2 (welcome with suggestions + AI reply) | Assert textarea empty after click |
| 6 | 2 (welcome with suggestions + slow AI reply) | `chunkSize: 1` on reply for disabled-state timing |
| 7 | 2 (welcome no suggestions + plain reply) | Assert `suggestion(0)` does not exist |
| 8 | 3 (welcome + AI with suggestions + plain reply) | Mid-conversation suggestion click |

---

## Implementation Notes

1. **Suggestion parsing**: The `<suggestion>text</suggestion>` tags are parsed from the raw AI text by `formatSuggestionActions()` in `utils/format.ts`. The parsed strings become `suggestionActions` in the message store.

2. **Disabled state flow**: `Suggestions.vue` receives `:disabled="disabled || pendingConfirmation"` from `message/index.vue`. The `disabled` prop comes from the chat panel's `disabled` computed, which is `true` when `messagePhase !== MessagePhase.Idle`. During AI processing (after a suggestion click with `chunkSize: 1`), `messagePhase` is `Processing` / `GeneratingResponse`, so all suggestion buttons become disabled HTML elements.

3. **Direct send vs. textarea**: Clicking a suggestion calls `emit('send:message', suggestion)` in the component tree — this bypasses the textarea entirely. The textarea value should remain `''` after the click.

4. **chunkSize: 1 for disabled-state test**: Use `chunkSize: 1` in Test 6 to ensure the AI response is still streaming when we check the disabled state. Add `cy.wait(300)` after the click to allow the phase to update before asserting disabled.

5. **Message IDs**: All tests use `afterEach(() => cy.cleanChatHistory())` to reset the counter. IDs start at 1 for each test.

6. **No `{ force: true }` needed for suggestion clicks**: Suggestions are visible buttons with `opacity: 1` by default (unlike bubble-action buttons). Normal `.click()` should work. However, suggestion buttons ARE `pointer-events: none` when disabled — for Test 6, use `should('be.disabled')` rather than attempting to click.
