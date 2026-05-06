# E2E Planner Learnings

## Component Mapping

- **context** feature → `pkg/rancher-ai-ui/components/context/SelectContext.vue`, `ContextTag.vue`, `components/panels/Context.vue`
- **message** feature → `pkg/rancher-ai-ui/components/message/index.vue`, `components/panels/Messages.vue`
- **multi-agent** feature → `pkg/rancher-ai-ui/components/agent/SelectAgent.vue`
- **chat panel** → `pkg/rancher-ai-ui/pages/Chat.vue`

## Selector Verification (Verified)

| Selector | Component | Notes |
|----------|-----------|-------|
| `.context-trigger` | `SelectContext.vue` line 96 | On `<rc-dropdown-trigger>` |
| `.context-dropdown` | `SelectContext.vue` line 89 | On `<rc-dropdown>` |
| `.context-reset` | `SelectContext.vue` line 142 | Container div |
| `.chat-context` | `Context.vue` line 27 | Root container, gets `.disabled-panel` class when disabled |
| `.disabled-panel` | `Context.vue` | Added to `.chat-context` when `disabled=true` |
| `rancher-ai-ui-context-tag-{valueLabel\|\|value}` | `ContextTag.vue` | Dynamic testid on inner div |
| `rancher-ai-ui-chat-panel-ready` | `Chat.vue` | Dynamic: shows when `isChatInitialized && ws?.readyState === 1` |
| `rancher-ai-ui-chat-panel-not-ready` | `Chat.vue` | Dynamic: shows when not ready |
| `rancher-ai-ui-chat-message-box-{id}` | `Messages.vue` | Message IDs: 1=welcome, 2=first user msg, 3=first AI response |
| `rancher-ai-ui-context-tag-{label}` in message | `message/index.vue` | User messages display context tags (role=User + contextContent) |

## Selector Anti-Patterns

- **`.rc-dropdown-item`** — `RcDropdownItem` from `@components/RcDropdown` external library; CSS class unverifiable without source. Use `cy.contains('.context-dropdown', text)` instead or add `data-testid` to items.
- **`.be.disabled` on Vue components** — Don't use `.should('be.disabled')` on class names assigned to Vue component wrappers (e.g., `<rc-dropdown-trigger class="context-trigger">`). The component may not render a `<button>` root or may not forward the `disabled` attribute. Use CSS class checks (e.g., `.disabled-panel`) or `aria-disabled` attributes instead.

## Common Plan Issues

- Test 7 (disabled state): Checking `.be.disabled` on a Vue component class is risky. Always use verifiable CSS class (`.disabled-panel` exists on `.chat-context` in Context.vue).
- Context tags appear **inside user messages** (via `message/index.vue` when `role=User && contextContent?.length`) — `MessagePo.context(label)` searches the whole page via `.get()`, not scoped to message.
- Message ID order: 1 = welcome (AI), 2 = first user msg, 3 = first AI response.

## Coverage Guidelines

- Context panel: test "No context" fallback (Home page), cluster tag auto-selection, dropdown add/remove, reset button, disabled state, and context not sent when deselected.
- Always verify mock LLM response is enqueued before `chat.sendMessage()`.
- Use `cy.cleanChatHistory()` in `afterEach`.

## Page Objects

- `ClusterDashboardPagePo` — used in `chat.spec.ts`; import from `@rancher/cypress/e2e/po/pages/explorer/cluster-dashboard.po`
- `MessagePo` — in `cypress/e2e/po/message.po.ts`; `.context(label)` checks page-wide for context tag testid
- New PO classes go in `cypress/e2e/po/`
