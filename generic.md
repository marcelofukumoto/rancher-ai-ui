# Generic (overflow notes)

See e2e-generic.learning.md for full learnings.

## console Feature — Prompt History / Keyboard Interaction (2026-03-31, Attempt 2 → 3, IN PROGRESS)

### Failure Pattern: Keyboard Events Not Triggering State Changes
- **Tests 1–4** (Prompt history ↑/↓ and Tab autocomplete) all timed out waiting for textarea value updates
- Errors at lines 32, 42, 56, 67 — all `AssertionError: Timed out retrying after 10000ms`
- The textarea value never updates after `{uparrow}`, `{downarrow}`, or `{tab}` keypresses
- Tests 5–8 pass (Enter/Shift+Enter send, disabled state, LLM label, popover) — basic interaction works

### Likely Root Causes
- Cypress `{uparrow}` / `{downarrow}` may not trigger `keydown` listeners in Vue if the textarea uses `@keydown.up` or `@keydown.down` (native browser key events vs synthetic)
- Tab key may be intercepted by Cypress focus management rather than reaching the component's keydown handler
- History state may not be populated — if the test doesn't wait for AI response completion before pressing ↑, history may be empty
- Possible fix: use `.trigger('keydown', { keyCode: 38, which: 38 })` for arrow keys instead of `.type('{uparrow}')`

### Anti-Patterns (Keyboard Events)
- Do NOT use `.type('{uparrow}')` or `.type('{downarrow}')` expecting Vue keydown handlers to fire — use `.trigger('keydown', { key: 'ArrowUp', keyCode: 38 })` instead
- Do NOT use `.type('{tab}')` for autocomplete — use `.trigger('keydown', { key: 'Tab', keyCode: 9 })`

---

## console Feature — RESOLVED (2026-03-31, Attempt 2)

### Root Cause Analysis

**Message index confusion (Tests 1–4, 6):**
- Chat message IDs are assigned by `++state.chats[chatId].msgIdCnt` (auto-increment from 0)
- After opening chat: id=1 is the welcome message (Role.System, `completed: false` initially)
- After user sends message: id=2 is the USER message (Role.User, never gets `completed: true`)
- After AI responds: id=3 is the AI response (Role.Assistant, gets `completed: true` on Tag.MessageEnd)
- For two exchanges: id=4 = user B, id=5 = AI response B
- **FIX**: Use `getMessage(3)` not `getMessage(2)` for AI response after first user message

**Console not disabled during processing (Test 6):**
- `Chat.vue` `disabled` computed only covers: `aiAgentDeploymentState !== Active`, `systemErrors.length > 0`, `MessagePhase.AwaitingConfirmation`
- The textarea is NEVER disabled during `MessagePhase.GeneratingResponse`
- **FIX**: Check `[data-teststatus="rancher-ai-ui-chat-message-status-3-inprogress"]` instead

### Verified Message Index Pattern
- `getMessage(1)` = welcome AI/system message
- `getMessage(2)` = first user message (use `.containsText()` to verify text, never `.isCompleted()`)
- `getMessage(3)` = first AI response (use `.isCompleted()` to wait for completion)
- For multiple exchanges: user messages are even, AI responses are odd (3, 5, 7, ...)
