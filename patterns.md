# Patterns

Reusable interaction patterns confirmed working in E2E tests.

## Login & Setup Flow

1. CDP bypass → navigate to `https://localhost:8005` → fill password → click login → accept EULA → wait for `/home`
2. Use `page.dispatchEvent('button', 'click')` for buttons intercepted by overlapping elements
3. `Ctrl+Shift+O` for new chat, `Alt+K` to toggle chat open/close

## CDP Security Bypass (Playwright MCP)

```js
const cdpSession = await page.context().newCDPSession(page);
await cdpSession.send('Security.setIgnoreCertificateErrors', { ignore: true });
await page.goto('https://localhost:8005', { waitUntil: 'domcontentloaded' });
```

## Playwright MCP Keyboard Events

- `page.dispatchEvent(selector, 'keydown', { key: 'ArrowUp', keyCode: 38, which: 38, code: 'ArrowUp' })` — ghost text recall
- `page.dispatchEvent(selector, 'keydown', { key: 'Tab', keyCode: 9, which: 9, code: 'Tab' })` — autocomplete accept
- Ghost text appears in `.chat-input-complete .text` overlay, NOT in textarea `.value`
- Tab hint label appears in `.tab-label-box` when ghost text is visible

## Mock Service Consumption

- The mock service IS consumed for the **welcome message** when a chat opens
- Always push N+1 mocks where N is the number of user messages you plan to send
- Mock push format: `{ agent: "rancher", text: { chunks: [...] } }` for adaptive; `{ agent: null, text: {...} }` for manual
- Enqueue: `POST ${rancherProxyPath}/v1/control/push` — verified in `cypress/support/commands/llm-mock-service-api.ts`
- Clear: `POST ${rancherProxyPath}/v1/control/clear`

## Message ID Sequence

- IDs from `store/chat.ts` — `msgIdCnt` starts at 0, incremented with `++msgIdCnt` per message
- `getMessage(1)` = welcome AI/system message
- `getMessage(2)` = first user message (use `.containsText()`, never `.isCompleted()`)
- `getMessage(3)` = first AI response (use `.isCompleted()` to wait for completion)
- Multiple exchanges: user messages are even (2, 4, 6), AI responses are odd (3, 5, 7)
- Badge flow (chat closed → badge click): ID=1 user badge msg, ID=2 AI response (no welcome)
- After `cleanChatHistory()`, new chat starts fresh with `msgIdCnt = 0`

## History Panel Behavior

- Clicking a chat item emits `open:chat` → always auto-closes panel
- Clicking overlay emits `close:panel` → closes panel
- Deleting active chat → also closes panel
- Empty chats (no user messages) are not persisted; need at least one user message

## Tool Confirmation Behavior

- Confirmation buttons use `v-if` — fully removed from DOM after confirm/cancel
- Multi-resource confirmation is sequential, NOT batched — each resource gets its own dialog
- Sequential IDs (3 resources): msg-1=welcome, msg-2=user, msg-3=first confirm, msg-4=second confirm, msg-5=result
- Cancel terminates the flow — no subsequent messages after cancel
- Console disabled during `AwaitingConfirmation`, re-enabled after resolution

## Multi-Agent Behavior

- `SelectAgent.vue` rendered via `v-if="props.agents.length > 1"` — absent with single agent
- `__adaptive__` option only rendered when `activeAgentNames.length > 1`
- Checkmark uses `.hidden` class (CSS `visibility: hidden`) — always in DOM, assert via class not visibility
- Agent label uses `agentMetadata?.agent?.name` (not displayName)
- `ADAPTIVE_MODE_ID = '__adaptive__'` → emits empty string on selection
- i18n: `Adaptive Agent Selection` (display name), `(Adaptive Mode)` (suffix for auto mode)

## Bubble Actions Hover

- Use `trigger('mouseenter', { force: true })` on `.chat-msg-bubble` to simulate hover
- Use `{ force: true }` on button clicks since buttons start at `opacity: 0` / `pointer-events: none`

## Disclaimer Trigger

- Trigger text is **"Verify the results."** (with "the" and period) — key: `ai.configurations.verifyResults.button.label`
- Trigger element: `.textlabel-popper .inline-button` inside the console info bar

## Agent Config Creation (API)

- `POST /v1/ai.cattle.io.aiagentconfig` requires CSRF token from `CSRF` cookie
