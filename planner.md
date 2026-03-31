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
- `.disabled-panel` → `components/panels/Console.vue` (lines ~244, ~282; applied when `props.disabled` is true)
- `.disclaimer` → `components/console/VerifyResultsDisclaimer.vue` (line 22)
- `.disclaimer-section-title` → `components/console/VerifyResultsDisclaimer.vue` (line 65)
- `.tab-label-box` → `components/panels/Console.vue` (confirmed exists in template)

### CSS Selectors (no data-testid available)
- `.llm-model-label` → `components/console/LlmModelLabel.vue`
- `.textlabel-popper .inline-button` → `components/popover/TextLabel.vue`

## Component Mapping

| Feature Area | Key Components |
|---|---|
| `console` | `components/panels/Console.vue`, `components/console/LlmModelLabel.vue`, `components/console/VerifyResultsDisclaimer.vue`, `components/popover/TextLabel.vue`, `composables/useInputComposable.ts` |

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
- Test disabled state during AI processing (use small `chunkSize: 1` for reliable timing)
- Test visual elements: LLM model label visibility, disclaimer popover

## Mock Service API (Verified)
- Enqueue: `POST ${llmMockServiceProxyPath}/v1/control/push` body: `{ agent, text: { chunks: [...] } }` — verified in `cypress/support/commands/llm-mock-service-api.ts`
- Clear: `POST ${llmMockServiceProxyPath}/v1/control/clear` — verified in same file
- The mock-agent (port 8000) is **deprecated**; use llm-mock service via Rancher proxy
- Quick reference says `http://localhost:1080/mockserver/expectation` — do NOT use; correct API is via Rancher proxy path with `/v1/control/push`

## Disclaimer Trigger
- The "Verify results" trigger label text is actually **"Verify the results."** (with "the" and period) — from `l10n/en-us.yaml` key `ai.configurations.verifyResults.button.label`
- Trigger element is `.textlabel-popper .inline-button` inside the console info bar

## Anti-Patterns

- Don't use `chunkSize: 5` or higher for "disabled while processing" tests — use `chunkSize: 1` with long text for reliable timing
- Don't describe `{uparrow}` as changing the textarea value — it fills `.chat-input-complete .text` overlay
- Don't hardcode message IDs without documenting the full message sequence in preconditions
- Avoid `.v-popper__inner` as the primary popover selector — prefer component-specific classes like `.disclaimer`
- Don't forget `{ force: true }` for `{tab}` keypress in textarea
- Don't use the disclaimer trigger text "Verify results" alone — the actual text is "Verify the results." (include "the" and period or use partial match)
