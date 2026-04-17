# Test Plan: Message Summary Expand/Collapse

**Feature Area:** message-summary  
**Date Created:** 2026-04-17  
**Plan Type:** Initial  
**Spec File:** `cypress/e2e/tests/features/message-summary.spec.ts`

## Source Components Analyzed

| Component | Path |
|-----------|------|
| Message component | `pkg/rancher-ai-ui/components/message/index.vue` |
| Template message factory | `pkg/rancher-ai-ui/handlers/hooks/template-message.ts` |
| WS message composable | `pkg/rancher-ai-ui/composables/useChatMessageComposable.ts` |
| Sliding badge overlay | `pkg/rancher-ai-ui/handlers/hooks/overlay/badge-sliding.ts` |
| Chat page | `pkg/rancher-ai-ui/pages/Chat.vue` |
| Chat store | `pkg/rancher-ai-ui/store/chat.ts` |

## Feature Overview

When a user clicks a sliding badge (e.g., on the cluster status column in the home page),
the message sent to the AI contains two versions of the text:

- **`summaryContent`** – A short HTML snippet (rendered with `v-clean-html`) shown as a
  concise preview. Example: `"Please analyse the Cluster <strong>local</strong> and
  troubleshoot any problems."`
- **`messageContent`** (full prompt) – The detailed prompt actually sent to the AI
  (e.g., `"Explain what the 'active' state means for the Cluster local in the... - Confirm
  that this is the expected state and what it implies."`).

`message/index.vue` hides the full message by default and shows only the summary, plus a
**"See More"** inline button. Clicking it reveals the full text and changes the button to
**"See Less"**. Clicking "See Less" collapses back.

### Key i18n Strings

| Key | Value |
|-----|-------|
| `ai.message.actions.showCompleteMessage` | `See More` |
| `ai.message.actions.hideCompleteMessage` | `See Less` |
| Summary (cluster): `ai.message.template.summary.analyseKindAndTroubleshoot` | `Please analyse the {kind} "<strong>{name}</strong>" and troubleshoot any problems.` |

### Message ID Behavior

- **Badge flow (chat closed → badge click → chat auto-opens):**
  - `messageBox` is set in store before WS connects.
  - `onopen()` skips welcome message and immediately sends the badge message.
  - ID=1 → user badge message (has `summaryContent`)
  - ID=2 → AI response
- **Direct chat flow (chat.open() → send message):**
  - ID=1 → welcome template message
  - ID=2 → user typed message (no `summaryContent`)
  - ID=3 → AI response

## Verified Selectors

| Selector | Source | Notes |
|----------|--------|-------|
| `[data-testid="rancher-ai-ui-chat-message-box-{N}"]` | `components/panels/Messages.vue` | Dynamic by message ID |
| `[data-testid="rancher-ai-ui-chat-message-formatted-content"]` | `components/message/index.vue` line 174 | `v-if="formattedMessageContent && (!summaryContent \|\| showCompleteMessage)"` — hidden when summary exists and not expanded |
| `.inline-button` | `components/message/index.vue` lines 206, 215 | Second `.inline-button` is for See More/See Less (`v-if="!!summaryContent"`) |
| `.chat-msg-user-expanded` | `components/message/index.vue` line 177 | CSS class on the expanded content span: `v-bind:class="{'chat-msg-user-expanded': summaryContent && showCompleteMessage}"` |
| `[data-testid="rancher-ai-ui-sliding-badge"]` | `handlers/hooks/overlay/badge-sliding.ts` line 173 | Badge overlay element |
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | `pages/Chat.vue` | Chat panel ready indicator |
| `[data-testid="rancher-ai-ui-chat-container"]` | `pages/Chat.vue` | Chat panel root |

## Test Cases

---

### Test 1: Badge message shows summary content with "See More" button

**Description:**  
When a user opens the chat via a sliding badge click, the resulting user message displays
only the short summary HTML snippet (not the full prompt), and an inline "See More" button
is visible. The full message content element is absent from the DOM.

**Preconditions:**
- User is logged in.
- Home page is loaded (`HomePagePo.goTo()`).
- One LLM response is enqueued: `cy.enqueueLLMResponse({ text: 'Cluster analysis complete.', chunkSize: 10 })`.

**Steps:**
1. Get the home page cluster list: `homePage.list().resourceTable().sortableTable().row(0).column(0)`.
2. Create `SlidingBadgePo` wrapping the status column element.
3. Call `slidingBadge.click()` — this hovers the row, triggers the badge, and clicks it.
4. Assert chat has opened: `chat.isOpen()`.
5. Wait for AI response: `chat.getMessage(2).isCompleted()`.

**Assertions:**
- `chat.getMessage(1)` contains text `'Please analyse the Cluster'`.
- `chat.getMessage(1)` contains text `'See More'`.
- `[data-testid="rancher-ai-ui-chat-message-box-1"] [data-testid="rancher-ai-ui-chat-message-formatted-content"]`
  does NOT exist in DOM (hidden when not expanded).

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `.inline-button` (with text "See More")
- `rancher-ai-ui-chat-message-formatted-content` (should not exist)

**Screenshot:** `message-summary-test-1-badge-shows-summary`

---

### Test 2: Clicking "See More" expands the full message text

**Description:**  
Clicking the "See More" inline button on a summary message reveals the full prompt text
inside the `rancher-ai-ui-chat-message-formatted-content` element. The button label changes
to "See Less", and the `.chat-msg-user-expanded` CSS class is applied to the expanded span.

**Preconditions:**
- Same badge flow setup as Test 1. AI response (ID=2) has completed.
- Message ID=1 is visible with "See More" button (summary state).

**Steps:**
1. Get message box 1: `const msg = chat.getMessage(1)`.
2. Find the inline "See More" button:
   `cy.get('[data-testid="rancher-ai-ui-chat-message-box-1"] .inline-button').contains('See More').click()`.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-1"] [data-testid="rancher-ai-ui-chat-message-formatted-content"]`
  now **exists** and is visible.
- `[data-testid="rancher-ai-ui-chat-message-box-1"] [data-testid="rancher-ai-ui-chat-message-formatted-content"]`
  has class `.chat-msg-user-expanded`.
- `[data-testid="rancher-ai-ui-chat-message-box-1"] .inline-button` contains text `'See Less'`
  (button label has changed).
- The summary text (short preview) is still present: message box contains `'Please analyse the Cluster'`.

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `.inline-button` (text "See More" before click, "See Less" after)
- `rancher-ai-ui-chat-message-formatted-content`
- `.chat-msg-user-expanded`

**Screenshot:** `message-summary-test-2-expanded-full-message`

---

### Test 3: Clicking "See Less" collapses back to summary

**Description:**  
After expanding the full message with "See More", clicking "See Less" collapses the message
back to summary view. The full content element is removed from the DOM and the button label
returns to "See More".

**Preconditions:**
- Continuation of Test 2 state: message ID=1 is expanded (See Less visible,
  `rancher-ai-ui-chat-message-formatted-content` present, `.chat-msg-user-expanded` applied).

**Steps:**
1. Click the "See Less" button:
   `cy.get('[data-testid="rancher-ai-ui-chat-message-box-1"] .inline-button').contains('See Less').click()`.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-1"] [data-testid="rancher-ai-ui-chat-message-formatted-content"]`
  does **not** exist in DOM (collapsed).
- `[data-testid="rancher-ai-ui-chat-message-box-1"] .inline-button` contains text `'See More'`
  (button reverted).
- Summary text is still visible: message box contains `'Please analyse the Cluster'`.

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `.inline-button` (text "See Less" before click, "See More" after)
- `rancher-ai-ui-chat-message-formatted-content` (should not exist after click)

**Screenshot:** `message-summary-test-3-collapsed-back-to-summary`

---

### Test 4: Summary HTML renders resource name in bold

**Description:**  
The `summaryContent` field is HTML (not plain text). The resource name inside the summary
is wrapped in `<strong>` tags and should render as bold text. This test verifies that
`v-clean-html` correctly renders the bold formatting.

**Preconditions:**
- Same badge flow setup as Test 1 using the `local` cluster.
- Message ID=1 is visible (summary state, not expanded).

**Steps:**
1. Get message box 1.
2. Query for `strong` element within the message box.

**Assertions:**
- `cy.get('[data-testid="rancher-ai-ui-chat-message-box-1"] strong')` exists.
- The `strong` element contains text `'local'` (the cluster name).

**Selectors:**
- `rancher-ai-ui-chat-message-box-1`
- `strong` (child element rendered from v-clean-html summary)

**Screenshot:** `message-summary-test-4-bold-resource-name`

---

### Test 5: Regular typed user messages show full content without "See More"

**Description:**  
User messages typed directly in the console (not from hooks) have no `summaryContent`,
so the full message text is shown immediately with no expand button. The
`rancher-ai-ui-chat-message-formatted-content` element is directly visible.

**Preconditions:**
- Chat opened via `chat.open()` (welcome message = ID=1).
- One LLM response enqueued: `cy.enqueueLLMResponse({ text: 'Got it.' })`.

**Steps:**
1. `chat.open()` and wait for welcome message: `chat.getMessage(1).isCompleted()`.
2. Send a message: `chat.sendMessage('Hello Liz')`.
3. Wait for AI response: `chat.getMessage(3).isCompleted()`.
4. Inspect user message ID=2.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-2"] [data-testid="rancher-ai-ui-chat-message-formatted-content"]`
  **exists** and contains text `'Hello Liz'`.
- `[data-testid="rancher-ai-ui-chat-message-box-2"] .inline-button` does **not** exist
  (no summary → no See More button).

**Selectors:**
- `rancher-ai-ui-chat-message-box-2`
- `rancher-ai-ui-chat-message-formatted-content` (should exist)
- `.inline-button` (should not exist)

**Screenshot:** `message-summary-test-5-regular-message-no-see-more`

---

### Test 6: AI assistant response message has no "See More" button

**Description:**  
AI assistant messages (role=Assistant) never have `summaryContent`, so the "See More" button
is never rendered for them. Their text is rendered in `rancher-ai-ui-chat-message-formatted-content`
directly. This test ensures the inline-button only appears for user messages with
hook-injected `summaryContent`.

**Preconditions:**
- Badge flow: ID=1 is user badge message (summary), ID=2 is AI response.
- AI response (ID=2) has completed.

**Steps:**
1. Reuse badge flow from Test 1 (or a fresh badge click after cleanup).
2. Wait for AI response: `chat.getMessage(2).isCompleted()`.
3. Inspect AI message ID=2.

**Assertions:**
- `[data-testid="rancher-ai-ui-chat-message-box-2"] .inline-button` does **not** exist
  (AI messages have no summary expand button).
- `[data-testid="rancher-ai-ui-chat-message-box-2"] [data-testid="rancher-ai-ui-chat-message-formatted-content"]`
  **exists** and is visible (AI message renders full content directly).

**Selectors:**
- `rancher-ai-ui-chat-message-box-2`
- `.inline-button` (should not exist in AI message)
- `rancher-ai-ui-chat-message-formatted-content` (should exist)

**Screenshot:** `message-summary-test-6-ai-message-no-see-more`

---

## Page Objects Needed

### Reuse Existing POs

| PO | Import Path | Usage |
|----|-------------|-------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | `open()`, `getMessage(N)`, `sendMessage()`, `isOpen()` |
| `MessagePo` | `@/cypress/e2e/po/message.po` | `containsText()`, `isCompleted()`, `scrollIntoView()` |
| `SlidingBadgePo` | `@/cypress/e2e/po/hook.po` | `click()` — triggers hover + badge click on target element |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | `goTo()`, `list()` |

### Suggested MessagePo Extensions (for spec writer)

Add these methods to `MessagePo` (or use inline `cy.get()` for direct element access):

```typescript
// In MessagePo class:
seeMoreButton() {
  return this.self().find('.inline-button').contains('See More');
}

seeLessButton() {
  return this.self().find('.inline-button').contains('See Less');
}

formattedContent() {
  return this.self().find('[data-testid="rancher-ai-ui-chat-message-formatted-content"]');
}

hasSummaryExpander() {
  return this.self().find('.inline-button');
}
```

### No New PO Files Required

All required interactions can be covered by existing POs and inline `cy.get()` calls.

## Custom Commands

| Command | Usage |
|---------|-------|
| `cy.login()` | Log in before each test |
| `cy.enqueueLLMResponse({ text, chunkSize? })` | Queue a mock AI response before badge click |
| `cy.cleanChatHistory()` | Reset chat state in `afterEach` |

## Mock Data

| Test | LLM Response |
|------|-------------|
| Tests 1–4, 6 | `cy.enqueueLLMResponse({ text: 'Cluster analysis complete.', chunkSize: 10 })` |
| Test 5 | `cy.enqueueLLMResponse({ text: 'Got it.' })` |

**Note:** Enqueue the LLM response **before** triggering the badge click, since the chat
opens and immediately sends the message to the AI upon WS connect.

## Spec File Location

```
cypress/e2e/tests/features/message-summary.spec.ts
```

## Implementation Notes

- **Badge click pattern:** Use `HomePagePo.goTo()` + `homePage.list().resourceTable().sortableTable().row(0).column(0)` to get the status column, then `new SlidingBadgePo(statusColumn).click()`. Refer to `cypress/e2e/tests/features/hooks.spec.ts` for the reference pattern.
- **No welcome message in badge flow:** When the badge is clicked with the chat closed, `onopen()` in `useChatMessageComposable.ts` detects `messageBox.value` is set and skips the welcome message, sending the badge message directly. ID=1 is always the user badge message.
- **After `cleanChatHistory()`:** Message IDs reset; a fresh badge flow starts at ID=1.
- **Testing `.inline-button` text:** Use `cy.contains('See More')` scoped inside the message box. There are two `.inline-button` elements possible (thinking toggle and summary toggle), but only the summary one appears in user messages. Scope with `.contains()` for reliability.
- **Verifying `formattedContent` absence:** Use `.should('not.exist')` — the element is removed from the DOM via `v-if` (not just hidden), so `should('not.exist')` is the correct assertion.
- **`v-clean-html` and strong tags:** `v-clean-html` sanitizes HTML but allows standard tags like `<strong>`. The cluster name rendered in bold via `<strong>local</strong>` is accessible with `cy.get('strong').contains('local')`.
