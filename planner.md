# E2E Planner Learnings

## Selector Verification

### Verified Selectors (console feature area)
- `rancher-ai-ui-chat-console` → `components/panels/Console.vue`
- `rancher-ai-ui-chat-input-textarea` → `components/panels/Console.vue` (inside the console)
- `rancher-ai-ui-chat-panel-ready` → `pages/Chat.vue` (dynamic: `:data-testid="\`rancher-ai-ui-chat-panel-${ isChatInitialized && ws?.readyState === 1 ? 'ready' : 'not-ready' }\`"`)
- `rancher-ai-ui-chat-message-box-{id}` → `components/panels/Messages.vue` (uses `message.id` from store)
- `rancher-ai-ui-chat-container` → `pages/Chat.vue`
- `rancher-ai-ui-multi-agent-select` → `cypress/e2e/po/console.po.ts` confirms it exists
- `.send-button` → `components/panels/Console.vue` (line ~285, inside `.chat-input-complete` wrapper)
- `.chat-input-complete` → `components/panels/Console.vue` (line ~249, wraps overlay + send button)
- `.chat-input-complete .text` → `components/panels/Console.vue` (line ~251, `<div class="text">` inside `.chat-input-complete`)
- `.disabled-panel` → `components/panels/Console.vue` (lines ~244, ~282; applied when `props.disabled` is true — see CRITICAL note below)
- `.disclaimer` → `components/console/VerifyResultsDisclaimer.vue` (line 22)
- `.disclaimer-section-title` → `components/console/VerifyResultsDisclaimer.vue` (line 65)
- `.tab-label-box` → `components/panels/Console.vue` (confirmed exists in template)

### Verified Selectors (chat-panel-menu feature area)
- `.chat-console-menu-container` → `components/header/ChatPanelMenu.vue` (wrapper div for the ⋮ menu)
- `.chat-console-menu-container button` → `components/header/ChatPanelMenu.vue` (`rc-dropdown-trigger` renders as `<button>` inside wrapper)
- `.shortcuts` → `components/header/KeyboardShortcuts.vue` (content wrapper div)
- `.shortcuts-title` → `components/header/KeyboardShortcuts.vue` (spans "Keyboard Shortcuts")
- `.shortcuts-row` → `components/header/KeyboardShortcuts.vue` (each shortcut entry row)
- `.shortcuts-action` → `components/header/KeyboardShortcuts.vue` (action label span)
- `.shortcuts-key` → `components/header/KeyboardShortcuts.vue` (`<kbd class="shortcuts-key">` element)
- **NOTE**: `rancher-ai-ui-chat-menu-button` (from quick reference) does NOT exist in source — use CSS selectors instead
- `Header.vue` does NOT pass `disabled` prop to `ChatPanelMenu`, so menu is always enabled regardless of chat state

### Verified Selectors (message-bubble-actions feature area)
- `.chat-msg-bubble` → `components/message/index.vue` (class on bubble div)
- `.chat-msg-bubble-actions` → `components/message/index.vue` (v-if="!props.disabled"; CSS opacity:0 by default, 1 on :hover)
- `.bubble-action-btn` → `components/message/BubbleButton.vue` (button class)
- `.bubble-action-btn .icon-copy` → BubbleButton icon rendered as `<i class="icon icon-copy">` (default copy state)
- `.bubble-action-btn .icon-checkmark` → BubbleButton icon when `showCopySuccess === true` (1-second feedback)
- `.bubble-action-btn .icon-backup` → BubbleButton icon for resend (User messages only, `v-if="role === User && !pendingConfirmation"`)
- `rancher-ai-ui-chat-message-show-thinking-button` → `components/message/index.vue` on BubbleButton (v-if: role===Assistant && !!thinkingContent)
- `.inline-button` → `components/message/index.vue` on RcButton for "Hide Thinking" (v-if: role===Assistant && !!thinkingContent && showThinking)
- `rancher-ai-ui-chat-message-formatted-content` → `components/message/index.vue` on formatted message span

### CSS Selectors (no data-testid available)
- `.llm-model-label` → `components/console/LlmModelLabel.vue`
- `.textlabel-popper .inline-button` → `components/popover/TextLabel.vue`

## Component Mapping

| Feature Area | Key Components |
|---|---|
| `console` | `components/panels/Console.vue`, `components/console/LlmModelLabel.vue`, `components/console/VerifyResultsDisclaimer.vue`, `components/popover/TextLabel.vue`, `composables/useInputComposable.ts` |
| `message-bubble-actions` | `components/message/index.vue`, `components/message/BubbleButton.vue`, `composables/useInputComposable.ts`, `cypress/e2e/po/message.po.ts` |
| `chat-panel-menu` | `components/header/ChatPanelMenu.vue`, `components/panels/Header.vue`, `components/header/KeyboardShortcuts.vue`, `components/popover/TextLabel.vue`, `pages/Chat.vue`, `composables/useChatMessageComposable.ts` |

## Message ID Behavior
- Message IDs come from `store/chat.ts` — `msgIdCnt` starts at `0`, incremented with `++msgIdCnt` per message
- After `cleanChatHistory()`, a new chat starts fresh with `msgIdCnt = 0`
- First message (e.g., AI welcome) → ID 1; second message → ID 2; etc.
- Plans that reference `rancher-ai-ui-chat-message-box-2` assume a welcome message is sent as ID 1

## Common Plan Issues

- **chunkSize inconsistency**: Plans sometimes list different `chunkSize` values in Steps vs. Mock Data table vs. Implementation Notes — spec writer should use Implementation Notes as the authoritative value
- **Ghost suggestion vs. recalled text**: `{uparrow}` in textarea fills `.chat-input-complete .text` overlay (NOT the textarea value itself); plans should not describe a "ghost text" assertion after pressing up arrow as changing the textarea value
- **Message ID assumptions**: Must document which messages precede the target message in tests that use `rancher-ai-ui-chat-message-box-{N}` selectors

## Coverage Guidelines

For `console` feature area:
- Always test prompt history: up arrow recall, down arrow clear, multi-message navigation
- Always test tab autocomplete (requires `{ force: true }`)
- Test send behavior: Enter to send, Shift+Enter for newline
- **CRITICAL**: Do NOT test `.disabled-panel` during `GeneratingResponse` (streaming) phase — `Chat.vue`'s `disabled` computed does NOT include `MessagePhase.GeneratingResponse`. The console is intentionally kept active during streaming. `.disabled-panel` is only applied when: service is not Active, systemErrors exist, or phase is `AwaitingConfirmation`.
- If testing disabled state, test the `AwaitingConfirmation` phase (tool confirmation flow) instead of streaming, OR verify the console remains ACTIVE during streaming
- Test visual elements: LLM model label visibility, disclaimer popover

For `message-bubble-actions` feature area:
- Always test copy icon toggle (icon-copy → icon-checkmark → icon-copy after 1 sec timeout)
- Always test resend button presence on user messages AND absence on AI messages
- Test thinking toggle: show via BubbleButton, hide via `.inline-button` "Hide Thinking"
- Test disabled state: `.chat-msg-bubble-actions` completely absent from DOM when panel disabled (v-if, not CSS)
- Use `trigger('mouseenter', { force: true })` on `.chat-msg-bubble` to simulate hover; use `{ force: true }` on clicks since buttons start at opacity:0/pointer-events:none

For `chat-panel-menu` feature area:
- Always verify menu button selector via CSS: `.chat-console-menu-container button` (NOT `rancher-ai-ui-chat-menu-button` which does not exist)
- Test all three menu options: Download Messages, View Keyboard Shortcuts, Edit Configuration
- For download test: stub `window.URL.createObjectURL` BEFORE clicking menu
- For shortcuts overlay: verify with `.shortcuts-title`, `.shortcuts-row` count, and text content
- All 6 shortcut entries must be verified by text (verified against `en-us.yaml`)
- For outside-click dismiss test: use `cy.get('[data-testid="rancher-ai-ui-chat-container"]').click(10, 200)` NOT the close button


- Enqueue: `POST ${llmMockServiceProxyPath}/v1/control/push` body: `{ agent, text: { chunks: [...] } }` — verified in `cypress/support/commands/llm-mock-service-api.ts`
- Clear: `POST ${llmMockServiceProxyPath}/v1/control/clear` — verified in same file
- The mock-agent (port 8000) is **deprecated**; use llm-mock service via Rancher proxy
- Quick reference says `http://localhost:1080/mockserver/expectation` — do NOT use; correct API is via Rancher proxy path with `/v1/control/push`

## Disclaimer Trigger
- The "Verify results" trigger label text is actually **"Verify the results."** (with "the" and period) — from `l10n/en-us.yaml` key `ai.configurations.verifyResults.button.label`
- Trigger element is `.textlabel-popper .inline-button` inside the console info bar

## Anti-Patterns

- Don't use `chunkSize: 5` or higher for "disabled while processing" tests — use `chunkSize: 1` with long text for reliable timing
- **CRITICAL**: Do NOT assert `.disabled-panel` is present during `GeneratingResponse` (streaming) phase — the console is NOT disabled during streaming (confirmed by actual test execution run 23815581191). `Chat.vue` `disabled` only activates for `AwaitingConfirmation`, systemErrors, or non-Active service state
- Don't describe `{uparrow}` as changing the textarea value — it fills `.chat-input-complete .text` overlay
- Don't hardcode message IDs without documenting the full message sequence in preconditions
- Avoid `.v-popper__inner` as the primary popover selector — prefer component-specific classes like `.disclaimer`
- Don't forget `{ force: true }` for `{tab}` keypress in textarea
- Don't use the disclaimer trigger text "Verify results" alone — the actual text is "Verify the results." (include "the" and period or use partial match)
- Don't assert `chat.getMessage(N).content()` to check thinking visibility — `content()` returns only `rancher-ai-ui-chat-message-formatted-content` (never contains thinking text); use `containsText()` or `cy.contains()` scoped to the message box instead
- Don't use `rancher-ai-ui-chat-menu-button` data-testid — this does NOT exist in source despite being listed in the quick reference; use `.chat-console-menu-container button` instead
- Don't use close button (`rancher-ai-ui-chat-close-button`) as an outside-click target for dropdown dismiss tests — it will close the entire chat panel; use `.chat-container.click(10, 200)` instead



### PR #16 — console (2026-03-31, Run 23813233811)
- **Verdict**: APPROVED (9/9 checks passed)
- All 9 test cases well-structured with name/description/preconditions/steps/assertions/selectors/screenshot
- All 12 selectors verified against source components
- Plan correctly follows all anti-patterns from learnings (ghost text overlay, chunkSize 1, message ID docs)
- Minor note: Test 9 disclaimer trigger uses "Verify results" partial text match — `.textlabel-popper .inline-button` is more reliable alternative if text match fails

### PR #16 — console (2026-03-31, Run 23816536920) — NEEDS_FIX
- **Verdict**: NEEDS_FIX (Test 7 incorrect assertions confirmed by actual execution)
- **Test 7 failure**: Plan asserted `.disabled-panel` present during streaming (`GeneratingResponse` phase) — but `Chat.vue` `disabled` computed does NOT include this phase. Console intentionally stays active during streaming.
- Dispatched plan-fixer attempt 2 to revise Test 7

### PR #19 — message-bubble-actions (2026-03-31, Run 23814738991)
- **Verdict**: APPROVED (9/9 checks passed)
- All 9 test cases well-structured with all required fields
- All 10 selectors verified against source components (mix of data-testid and CSS class selectors)
- Plan correctly uses `trigger('mouseenter', { force: true })` for CSS-only hover reveal
- Plan correctly uses `chunkSize: 1` for Test 9 (disabled state timing)
- Plan correctly documents message ID sequences for each test
- Minor observation: Test 7 "before" assertion `content()` doesn't contain thinking text is trivially true (content() only returns formatted-message-content, not thinking span); spec writer should use `cy.contains('...').should('not.exist')` for a stronger pre-condition check

### PR #21 — chat-panel-menu (2026-03-31, Run 23817912811)
- **Verdict**: APPROVED (all checks passed)
- All 9 test cases well-structured with all required fields
- All CSS selectors verified against source components; plan correctly identifies `rancher-ai-ui-chat-menu-button` does NOT exist and uses CSS selector instead
- i18n label texts verified: menu options and all 6 keyboard shortcut entries
- Plan correctly notes `Header.vue` does NOT pass `disabled` to `ChatPanelMenu`
- Test 4 stub ordering correct; Test 9 Implementation Notes clarify to use container click (not close button) for outside-click dismiss

