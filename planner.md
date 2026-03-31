# E2E Planner Learnings

## Selector Verification

### Verified Selectors (console feature area)
- `rancher-ai-ui-chat-console` → `components/panels/Console.vue`
- `rancher-ai-ui-chat-input-textarea` → `components/panels/Console.vue` (inside the console)
- `rancher-ai-ui-chat-panel-ready` → `pages/Chat.vue` (dynamic: `:data-testid="\`rancher-ai-ui-chat-panel-${ isChatInitialized && ws?.readyState === 1 ? 'ready' : 'not-ready' }\`"`)
- `rancher-ai-ui-chat-message-box-{id}` → `components/panels/Messages.vue` (uses `message.id` from store)
- `rancher-ai-ui-chat-container` → `pages/Chat.vue`
- `rancher-ai-ui-multi-agent-select` → `cypress/e2e/po/console.po.ts` confirms it exists

### CSS Selectors (no data-testid available)
- `.llm-model-label` → `components/console/LlmModelLabel.vue`
- `.textlabel-popper .inline-button` → `components/popover/TextLabel.vue`
- `.disclaimer` → `components/console/VerifyResultsDisclaimer.vue`

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
- **Ghost suggestion vs. recalled text**: `{uparrow}` in textarea fills it directly (no ghost); plans should not describe a "ghost text" assertion after pressing up arrow
- **Message ID assumptions**: Must document which messages precede the target message in tests that use `rancher-ai-ui-chat-message-box-{N}` selectors

## Coverage Guidelines

For `console` feature area:
- Always test prompt history: up arrow recall, down arrow clear, multi-message navigation
- Always test tab autocomplete (requires `{ force: true }`)
- Test send behavior: Enter to send, Shift+Enter for newline
- Test disabled state during AI processing (use small `chunkSize: 1` for reliable timing)
- Test visual elements: LLM model label visibility, disclaimer popover

## Anti-Patterns

- Don't use `chunkSize: 5` or higher for "disabled while processing" tests — use `chunkSize: 1` with long text for reliable timing
- Don't describe `{uparrow}` as showing "ghost text" — it fills the textarea with the value
- Don't hardcode message IDs without documenting the full message sequence in preconditions
- Avoid `.v-popper__inner` as the primary popover selector — prefer component-specific classes like `.disclaimer`
