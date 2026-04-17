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

### Verified Selectors (message-summary feature area)
- `rancher-ai-ui-chat-message-box-{N}` → `components/panels/Messages.vue` line 201 (dynamic by message.id)
- `rancher-ai-ui-chat-message-formatted-content` → `components/message/index.vue` line 175 (`v-if="formattedMessageContent && (!summaryContent || showCompleteMessage)"`)
- `.inline-button` → `components/message/index.vue` lines 206 (thinking toggle), 215 (summary See More/Less toggle, `v-if="!!summaryContent"`)
- `.chat-msg-user-expanded` → `components/message/index.vue` line 177 (class on formatted-content span when `summaryContent && showCompleteMessage`)
- `rancher-ai-ui-sliding-badge` → `handlers/hooks/overlay/badge-sliding.ts` line 173
- i18n: `ai.message.actions.showCompleteMessage` → `See More`; `ai.message.actions.hideCompleteMessage` → `See Less` (en-us.yaml lines 53–54)
- i18n: `ai.message.template.summary.analyseKindAndTroubleshoot` → `'Please analyse the {kind} "<strong>{name}</strong>" and troubleshoot any problems.'` (en-us.yaml line 61)
- `formattedContent` element uses `v-if` (not `v-show`) → assert with `.should('not.exist')` when hidden

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

### Verified Selectors (history-panel feature area)
- `rancher-ai-ui-chat-history-button` → `components/panels/Header.vue`
- `rancher-ai-ui-chat-history-panel` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-panel-overlay` → `components/panels/History.vue` (click.self on wrapper closes panel)
- `rancher-ai-ui-chat-history-header-button` → `components/history/HistoryHeader.vue`
- `rancher-ai-ui-chat-history-create-chat-button` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-chat-item-{N}` → `components/panels/History.vue` (dynamic: `rancher-ai-ui-chat-history-chat-item-${ index }`, 0-based)
- `rancher-ai-ui-chat-history-item-name` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-item-name-input` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-chat-item-menu-button` → `components/history/HistoryChatMenu.vue`
- `rancher-ai-ui-chat-history-chat-item-menu-button-option-rename-chat` → `HistoryChatMenu.vue` (dynamic via `opt.id = 'rename-chat'`)
- `rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat` → `HistoryChatMenu.vue` (dynamic via `opt.id = 'delete-chat'`)
- `prompt-remove-confirm-button` → `dialog/DeleteChatCard.vue` line 79
- `.focused` (CSS class) → `components/panels/History.vue` (`:class="{'focused': props.activeChatId === chat.id || editingChat?.id === chat.id }"`)
- **NOTE**: `rancher-ai-ui-delete-chat-confirm-button` (listed in quick reference) does NOT exist in source — use `prompt-remove-confirm-button` instead

### CSS Selectors (no data-testid available)
- `.llm-model-label` → `components/console/LlmModelLabel.vue`
- `.textlabel-popper .inline-button` → `components/popover/TextLabel.vue`

## Component Mapping

| Feature Area | Key Components |
|---|---|
| `console` | `components/panels/Console.vue`, `components/console/LlmModelLabel.vue`, `components/console/VerifyResultsDisclaimer.vue`, `components/popover/TextLabel.vue`, `composables/useInputComposable.ts` |
| `message-bubble-actions` | `components/message/index.vue`, `components/message/BubbleButton.vue`, `composables/useInputComposable.ts`, `cypress/e2e/po/message.po.ts` |
| `chat-panel-menu` | `components/header/ChatPanelMenu.vue`, `components/panels/Header.vue`, `components/header/KeyboardShortcuts.vue`, `components/popover/TextLabel.vue`, `pages/Chat.vue`, `composables/useChatMessageComposable.ts` |
| `history-panel` | `components/panels/History.vue`, `components/panels/Header.vue`, `components/history/HistoryHeader.vue`, `components/history/HistoryChatMenu.vue`, `dialog/DeleteChatCard.vue`, `pages/Chat.vue` |

## Message ID Behavior
- Message IDs come from `store/chat.ts` — `msgIdCnt` starts at `0`, incremented with `++msgIdCnt` per message
- After `cleanChatHistory()`, a new chat starts fresh with `msgIdCnt = 0`
- First message (e.g., AI welcome) → ID 1; second message → ID 2; etc.
- Plans that reference `rancher-ai-ui-chat-message-box-2` assume a welcome message is sent as ID 1

## History Panel Behavior Notes
- Clicking a history chat item emits `open:chat` → `Chat.vue` calls `ensureReconnectionAndLoadChat` which sets `showHistory.value = false` → history panel **always** auto-closes when loading a chat
- Clicking overlay emits `close:panel` → `Chat.vue` sets `showHistory.value = false`
- Deleting active chat calls `ensureReconnectionAndLoadChat(null)` → also sets `showHistory.value = false`
- Empty chats (no user messages) are not persisted; only chats with at least one user message appear in history

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

For `history-panel` feature area:
- History panel auto-closes when loading a chat, deleting active chat, or clicking overlay
- Use `hover()` before clicking `rancher-ai-ui-chat-history-chat-item-menu-button` (only visible on hover)
- Coordinate-based overlay click recommended to ensure click lands outside panel: `click({ position: { x: 900, y: 200 } })`
- Use `prompt-remove-confirm-button` for delete confirm (NOT `rancher-ai-ui-delete-chat-confirm-button`)
- Empty chats not persisted; must send at least one user message before chat appears in history

## Mock API Notes

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
- Don't assume history panel stays open after clicking a chat item — it always auto-closes (confirmed by source `Chat.vue`)

## PR History

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

### PR #22 — history-panel (2026-03-31, Run 23821676618)
- **Verdict**: APPROVED (all checks passed)
- All 9 test cases well-structured with all required fields
- All 15 selectors (including CSS `.focused`) verified against source components
- Plan correctly identifies `prompt-remove-confirm-button` (NOT `rancher-ai-ui-delete-chat-confirm-button` from quick reference which doesn't exist)
- Minor note: Plan says history panel "may or may not" auto-close after clicking chat item — in fact it always auto-closes (confirmed by source)
- History panel close behaviors correctly mapped: overlay click, header button, chat item click, chat deletion all close the panel

### PR #22 — history-panel (2026-03-31, Run 23822332507)
- **Verdict**: APPROVED (re-verification, all checks passed)
- Same plan as prior run; all 14 selectors re-verified against source
- Runner dispatched (attempt 1)

### PR #22 — history-panel (2026-03-31, Run 23823219074)
- **Verdict**: APPROVED (re-verification #3, all checks passed)
- Same plan as prior runs; all 15 selectors re-verified against source
- Runner dispatched (attempt 1)

### PR #23 — tool-confirmation (2026-03-31, Run 23823893066)
- **Verdict**: APPROVED (9/9 checks passed)
- All 8 test cases well-structured with all required fields (name/description/preconditions/steps/assertions/selectors/screenshot)
- All 12 selectors verified against source components (`Confirmation.vue`, `Console.vue`, `Messages.vue`, `Chat.vue`)
- Confirmation dialog selectors all exist in `components/message/Confirmation.vue` with correct data-testid attributes
- Plan correctly identifies that `disabled` computed in `Chat.vue` includes `AwaitingConfirmation` phase (Tests 3 is valid)
- Plan correctly identifies that confirmation buttons are removed via `v-if` (not CSS hide) — DOM-removal assertions are valid
- i18n text "Are you sure you want to proceed with this action?" confirmed correct in `l10n/en-us.yaml`
- Mock API URL uses correct Rancher proxy path (not localhost:1080 from quick reference)
- Runner dispatched (attempt 1)

### Verified Selectors (tool-confirmation feature area)
- `rancher-ai-ui-chat-message-confirmation-message` → `components/message/Confirmation.vue`
- `rancher-ai-ui-chat-message-confirmation-confirm-button` → `components/message/Confirmation.vue`
- `rancher-ai-ui-chat-message-confirmation-cancel-button` → `components/message/Confirmation.vue`
- `rancher-ai-ui-chat-message-confirmation-confirmed` → `components/message/Confirmation.vue`
- `rancher-ai-ui-chat-message-confirmation-canceled` → `components/message/Confirmation.vue`

### PR #23 — tool-confirmation (2026-03-31, Run 23824651850)
- **Verdict**: APPROVED (re-verification #2, all checks passed)
- Same plan as prior run (23823893066); all 12 selectors re-verified against source
- All 8 test cases well-structured with all required fields
- Runner dispatched (attempt 1)

### PR #24 — chat-panel-menu (2026-04-01, Run 23825702806)
- **Verdict**: NEEDS_FIX (1 check failed)
- **Failure**: Mock push endpoint uses HTTP `PUT` instead of `POST` — appears in 3 locations:
  1. Mock Data Setup section (global): `PUT .../v1/control/push`
  2. Test 4 Mock Setup step 2: `PUT .../v1/control/push`
  3. Implementation Notes: `HTTP PUT with JSON body`
- All 12 selectors verified correct; all i18n texts verified; structure/coverage/feasibility all pass
- Plan correctly identifies correct CSS selector for menu button and outside-click pattern
- Plan-fixer dispatched (attempt 1)

## Anti-Patterns (additions)
- Don't use `PUT` for the `/v1/control/push` mock API endpoint — correct method is `POST` (verified in `cypress/support/commands/llm-mock-service-api.ts` line 124)

### PR #23 — tool-confirmation (2026-04-01, Run 23825956400)
- **Verdict**: APPROVED (re-verification #3, all checks passed)
- Same plan as prior runs (23823893066, 23824651850); all 12 selectors re-verified against source
- All 8 test cases well-structured with all required fields
- Runner dispatched (attempt 1)

### PR #24 — chat-panel-menu (2026-04-01, Run 23826031524)
- **Verdict**: APPROVED (all checks passed — re-verification after plan-fixer fixed HTTP method)
- **Fix confirmed**: Mock push endpoint changed from `PUT` to `POST` in all 3 locations (Mock Data Setup, Test 4 Mock Setup, Implementation Notes)
- All 12 selectors re-verified against source (same as PR #21 which was previously APPROVED)
- All 9 i18n texts verified (3 menu options + 6 shortcut actions)
- Plan correctly identifies `rancher-ai-ui-chat-menu-button` does NOT exist; uses `.chat-console-menu-container button`
- Plan correctly uses Rancher proxy path for mock API (not localhost:1080)
- Runner dispatched (attempt 1)

### Verified Selectors (multi-agent feature area)
- `rancher-ai-ui-multi-agent-select` → `components/agent/SelectAgent.vue` (root div)
- `.selected-agent-name` → `components/agent/SelectAgent.vue` (trigger display label)
- `rancher-ai-ui-multi-agent-select-option-__adaptive__` → `SelectAgent.vue` (dynamic: `ADAPTIVE_MODE_ID = '__adaptive__'`)
- `rancher-ai-ui-multi-agent-select-option-{name}` → `SelectAgent.vue` (`:data-testid="\`rancher-ai-ui-multi-agent-select-option-${opt.name}\`"`)
- `.icon-checkmark` with `.hidden` class → `SelectAgent.vue` (`:class="{ hidden: opt.name !== selectedAgentName }"`, uses CSS `visibility: hidden`)
- `rancher-ai-ui-chat-message-selected-agent-label-{agentName}` → `components/message/index.vue` (`:data-testid="\`rancher-ai-ui-chat-message-selected-agent-label-${ props.message.agentMetadata?.agent?.name }\`"`)

## Component Mapping (multi-agent)

| Feature Area | Key Components |
|---|---|
| `multi-agent` | `components/agent/SelectAgent.vue`, `components/panels/Console.vue` (v-if for SelectAgent), `components/message/index.vue` (agent label), `composables/useAgentComposable.ts`, `composables/useChatMessageComposable.ts` |

## Multi-Agent Behavior Notes
- `SelectAgent.vue` is rendered via `v-if="props.agents.length > 1"` in `Console.vue` — absent in DOM with single agent
- `ADAPTIVE_MODE_ID = '__adaptive__'` → emits `''` (empty string) on selection to `useAgentComposable`
- Agent label on assistant messages: gated by `v-if="props.message.role === RoleEnum.Assistant && props.message.agentMetadata?.agent"`
- `agentMetadata` comes from `Tag.AgentMetadataStart` tagged string in WS stream (format: `{"agentName":"rancher","selectionMode":"auto|manual"}`)
- i18n: `ai.agents.items.default.displayName` = `Adaptive Agent Selection`, `ai.agents.selectionMode.auto` = `(Adaptive Mode)`
- Mock push format: `{ agent: "rancher", text: { chunks: [...] } }` for adaptive; `{ agent: null, text: {...} }` for manual
- Mock API endpoint: `POST /v1/control/push` via Rancher proxy at `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push`
- Agent config creation via API: `POST /v1/ai.cattle.io.aiagentconfig` requires CSRF token from `CSRF` cookie

### Verified Selectors (tool-confirmation feature area)
- `rancher-ai-ui-chat-message-confirmation-message` → `components/message/Confirmation.vue` (`<span v-clean-html="confirmationText">`)
- `rancher-ai-ui-chat-message-confirmation-confirm-button` → `components/message/Confirmation.vue` (RcButton inside `.standard-confirmation`, v-if: status===Pending)
- `rancher-ai-ui-chat-message-confirmation-cancel-button` → `components/message/Confirmation.vue` (RcButton inside `.standard-confirmation`, v-if: status===Pending)
- `rancher-ai-ui-chat-message-confirmation-confirmed` → `components/message/Confirmation.vue` (div inside `.status-confirmed`, v-if: status===Confirmed)
- `rancher-ai-ui-chat-message-confirmation-canceled` → `components/message/Confirmation.vue` (div inside `.status-canceled`, v-else-if: status===Canceled)

## Tool Confirmation Behavior Notes
- Confirmation buttons (`confirm-button`, `cancel-button`) use `v-if="props.value.status === ConfirmationStatus.Pending"` — fully removed from DOM after confirm/cancel
- Multi-resource confirmation (array args) is **sequential**, NOT batched — each resource gets its own confirmation dialog in a separate message box, one after another
- Sequential multi-resource message IDs (3 resources in array): msg-1=welcome, msg-2=user, msg-3=first confirmation, msg-4=second confirmation (after confirming first), msg-5=result text (after confirming second)
- Console `disabled` computed: only disabled during `AwaitingConfirmation`, NOT during `GeneratingResponse` — re-enabled after confirmation resolves
- Cancel does NOT deliver the next AI message — no msg-4 after cancel (canceling terminates the flow)
- `ConfirmationStatus.Pending` → buttons shown; `Confirmed` → confirmed indicator; `Canceled` → canceled indicator

### PR #23 — tool-confirmation (re-verification, Run 23828025817)
- **Verdict**: APPROVED — plan fixer's changes to Tests 6 & 7 confirmed correct
- Tests 6 & 7 now correctly describe sequential multi-resource confirmation (msg-3=first, msg-4=second, msg-5=result)
- Runner dispatched (attempt 1)

### PR #23 — tool-confirmation (re-verification, Run 23828961129)
- **Verdict**: APPROVED (re-verification #5, all checks passed)
- Same plan as prior runs; all 12 selectors re-verified against source
- All 8 test cases well-structured with all required fields
- Runner dispatched (attempt 1)

### PR #27 — context (2026-04-01, Run 23854298044)
- **Verdict**: APPROVED (all checks passed)
- All 9 test cases well-structured with all required fields (name/description/preconditions/steps/assertions/selectors/screenshot)
- All 22 selectors verified against source components
- Plan correctly identifies `rancher-ai-ui-context-tag-{value}` testid is on the inner `.tag-content` div (not root) — still works as CSS selector
- Source link `data-testid` correctly uses Vue 3 attribute inheritance to root element of `ContextTag` (confirmed: no `inheritAttrs: false`)
- i18n verified: `ai.context.none` = "No context" ✅, `ai.message.source.label` = "SOURCE" ✅
- Dropdown item text `cluster:local` confirmed from `SelectContext.vue` (`{{ opt.tag }}:{{ contextLabel(opt) }}`)
- Mock API: POST method ✅, correct Rancher proxy path ✅, R_SESS cookie auth documented ✅
- Coverage: context panel display, no-context, deselect via dropdown, remove X, reset, context-in-message, suggestions, suggestion click, source links
- Runner dispatched (attempt 1)

### PR #29 — message-summary (2026-04-17, Run 24559360985)
- **Verdict**: APPROVED (all checks passed on attempt 1)
- All 6 test cases well-structured with all required fields (name/description/preconditions/steps/assertions/selectors/screenshot)
- All 7 selectors verified against source components (5 unique data-testid + 2 CSS class selectors)
- Badge flow message ID sequence correctly documented: ID=1 user badge msg, ID=2 AI response (no welcome in badge flow)
- Direct chat flow: ID=1 welcome, ID=2 user typed, ID=3 AI response
- `.inline-button` scoped with `.contains()` to disambiguate from thinking toggle — correct approach
- `formattedContent` hidden via `v-if` (not `v-show`) → `.should('not.exist')` assertions correct
- `.chat-msg-user-expanded` class is ON the `rancher-ai-ui-chat-message-formatted-content` span itself (not the wrapper)
- i18n verified: `See More`/`See Less` at en-us.yaml lines 53–54; summary template at line 61
- Coverage: summary display, expand, collapse, HTML bold rendering, regular message (no See More), AI message (no See More)
- Runner dispatched (attempt 1)

### Verified Selectors (context feature area)
- `.context-select` → `SelectContext.vue` (root div, `v-if="props.options.length > 0"`)
- `.context-trigger` → `SelectContext.vue` (`rc-dropdown-trigger`)
- `.context-trigger-text` → `SelectContext.vue` (span inside trigger)
- `.context-dropdown` → `SelectContext.vue` (`rc-dropdown.context-dropdown`)
- `.context-reset` → `SelectContext.vue` (`v-if="options.length !== selected.length"`)
- `.no-context` → `SelectContext.vue` (`v-else` branch, `span.text-muted.no-context`)
- `.chat-context` → `Context.vue` (root div, gets `.disabled-panel` when disabled)
- `[data-testid="rancher-ai-ui-context-tag-{valueLabel||value}"]` → `ContextTag.vue` inner `.tag-content` div
- `button.vs__deselect` → `ContextTag.vue` (v-if: `removeEnabled=true`)
- `.vs__selected.tag` → `ContextTag.vue` root element (both classes present)
- `.user-context` → `ContextTag.vue` (`:class="{user-context: type==='user'}"` on root)
- `.chat-msg-user-context-tags` → `components/message/index.vue`
- `.chat-msg-user-context-tag` → `components/message/index.vue`
- `.suggestions-container` → `Suggestions.vue` (root div)
- `[data-testid="rancher-ai-ui-chat-message-suggestion-{N}"]` → `Suggestions.vue` (on `RcButton`, 0-based)
- `.chat-source-container` → `SourceLinks.vue` (root div)
- `.chat-msg-source-label` → `SourceLinks.vue` (i18n: "SOURCE")
- `[data-testid="rancher-ai-ui-chat-message-source-link-{N}"]` → `SourceLinks.vue` (attr inheritance to root of `ContextTag`)

## Component Mapping (context)

| Feature Area | Key Components |
|---|---|
| `message-summary` | `components/message/index.vue`, `handlers/hooks/overlay/badge-sliding.ts`, `handlers/hooks/template-message.ts`, `composables/useChatMessageComposable.ts`, `store/chat.ts`, `cypress/e2e/po/hook.po.ts` |
| `context` | `components/context/SelectContext.vue`, `components/context/ContextTag.vue`, `components/panels/Context.vue`, `composables/useContextComposable.ts`, `store/context.ts`, `components/message/Suggestions.vue`, `components/message/SourceLinks.vue`, `components/message/index.vue` |

## Context Feature Notes
- Cluster context tag: `{ tag: 'cluster', value: 'local', valueLabel: 'local', description: ..., icon: 'icon-cluster' }`
- Context only shown when on cluster path (`/c/<cluster-name>/...`); hidden on `/home`
- Dropdown item text format: `{opt.tag}:{contextLabel(opt)}` e.g. `cluster:local`
- Source link data-testid is on root `div.vs__selected.tag` via Vue 3 attr inheritance (NOT on inner `.tag-content` div which has `rancher-ai-ui-context-tag-{label}` testid)
- `ContextTag.vue` does NOT use `inheritAttrs: false` → fallthrough attrs go to root element

## i18n Verified (context)
- `ai.context.none` = `No context`
- `ai.context.add` = (Add context trigger label)
- `ai.context.reset` = (Reset button text)
- `ai.message.source.label` = `SOURCE`
- `ai.message.suggestions.label` = (Suggestions header, line 18 shows 'Here are a few suggestions based on your context:')

## Coverage Guidelines (message-summary feature area)
- Test expand/collapse cycle fully (show summary → See More → See Less → back to summary)
- Test HTML rendering via `v-clean-html` (bold `<strong>` tag for resource name)
- Test regular typed messages: no `summaryContent` → `formattedContent` shown directly, no `.inline-button`
- Test AI assistant messages: no `summaryContent` → full content visible, no `.inline-button`
- Document message ID sequences separately for badge flow vs. direct chat flow
- Scope `.inline-button` with `.contains('See More'/'See Less')` to avoid ambiguity with thinking toggle

## Message Summary Behavior Notes
- Badge flow (chat closed → badge click → chat opens): `onopen()` detects `messageBox.value` set → skips welcome → sends badge message directly → ID=1 user badge msg, ID=2 AI response
- Direct chat flow (chat.open() then send): ID=1 welcome, ID=2 user typed, ID=3 AI response
- `formattedContent` uses `v-if` (removed from DOM when hidden) → assert `.should('not.exist')` not `.should('be.hidden')`
- `.chat-msg-user-expanded` class is ON the `rancher-ai-ui-chat-message-formatted-content` span itself

### PR #30 — multi-agent (2026-04-17, Run 24565576242)
- **Verdict**: APPROVED (all checks passed on attempt 1)
- All 8 test cases well-structured with all required fields (name/description/preconditions/steps/assertions/selectors/screenshot)
- All 11 selectors verified against source components
- `rancher-ai-ui-multi-agent-select` → `SelectAgent.vue` (root div, data-testid)
- `rancher-ai-ui-multi-agent-select-option-{name}` → `SelectAgent.vue` dynamic via `opt.name`
- `ADAPTIVE_MODE_ID = '__adaptive__'` confirmed in source
- `.agent-trigger` → class on `rc-dropdown-trigger` in `SelectAgent.vue`
- `.selected-agent-name` → span class in `SelectAgent.vue`
- `.icon-checkmark.hidden` → `:class="{ hidden: opt.name !== selectedAgentName }"` → CSS `visibility: hidden` (NOT `display: none`; element always in DOM)
- `rancher-ai-ui-chat-message-selected-agent-label-{name}` → `message/index.vue` line 149 (dynamic via `agentMetadata?.agent?.name`)
- `agent: null` in mock push = manual mode (no `(Adaptive Mode)` suffix); `agent: "rancher"` = adaptive mode
- `__adaptive__` option only rendered when `activeAgentNames.length > 1` (multiple Active agents, not just configs)
- Mock API: `{ "agent": "rancher", "text": { "chunks": [...] } }` for adaptive; `{ "agent": null, "text": { "chunks": [...] } }` for manual
- i18n: `ai.agents.selectionMode.auto` = `(Adaptive Mode)`, `manual` = `` (empty), `ai.agents.items.default.displayName` = `Adaptive Agent Selection`
- Runner dispatched (attempt 1)

### Verified Selectors (multi-agent feature area)
- `rancher-ai-ui-multi-agent-select` → `components/agent/SelectAgent.vue` (root div)
- `rancher-ai-ui-multi-agent-select-option-{name}` → `SelectAgent.vue` (dynamic on `rc-dropdown-item`)
- `.agent-trigger` → `SelectAgent.vue` (class on `rc-dropdown-trigger`)
- `.selected-agent-name` → `SelectAgent.vue` (span inside trigger)
- `.icon-checkmark.hidden` → `SelectAgent.vue` (`:class="{hidden: opt.name !== selectedAgentName}"` — CSS visibility)
- `rancher-ai-ui-chat-message-selected-agent-label-{agentName}` → `components/message/index.vue` (v-if: role === Assistant && agentMetadata?.agent)

## Coverage Guidelines (multi-agent feature area)
- Test dropdown visibility gate: `v-if="props.agents.length > 1"` in Console.vue
- Test `__adaptive__` option gate: only shown when `activeAgentNames.length > 1`
- Checkmark uses CSS class `.hidden` (visibility:hidden) — always in DOM, use `.toHaveClass('hidden')` not `.toBeVisible()`
- `agent: null` → manual mode → label shows "Agent: {name}" without "(Adaptive Mode)"
- `agent: "rancher"` → adaptive → label shows "Agent: Rancher (Adaptive Mode)"
- Agent label data-testid uses `agentMetadata?.agent?.name` (not displayName)
