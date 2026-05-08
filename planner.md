# E2E Planner Learnings

## Component Mapping

- **context** feature → `pkg/rancher-ai-ui/components/context/SelectContext.vue`, `ContextTag.vue`, `components/panels/Context.vue`
- **message** feature → `pkg/rancher-ai-ui/components/message/index.vue`, `components/panels/Messages.vue`
- **message-resource-actions** feature → `pkg/rancher-ai-ui/components/message/action/index.vue` (list + show-more), `message/action/Action.vue` (individual button/link)
- **multi-agent** feature → `pkg/rancher-ai-ui/components/agent/SelectAgent.vue`
- **chat panel** → `pkg/rancher-ai-ui/pages/Chat.vue`

## Selector Verification (Verified)

| Selector | Component | Notes |
|----------|-----------|-------|
| `.context-trigger` | `SelectContext.vue` line 96 | On `<rc-dropdown-trigger>` |
| `.context-dropdown` | `SelectContext.vue` line 89 | On `<rc-dropdown>` |
| `.context-reset` | `SelectContext.vue` line 142 | Container div |
| `.chat-context` | `Context.vue` line 26 | Root container, gets `.disabled-panel` class when disabled |
| `.disabled-panel` | `Context.vue` | Added to `.chat-context` when `disabled=true` |
| `rancher-ai-ui-context-tag-{valueLabel\|\|value}` | `ContextTag.vue` | Dynamic testid on inner div |
| `rancher-ai-ui-chat-panel-ready` | `Chat.vue` | Dynamic: shows when `isChatInitialized && ws?.readyState === 1` |
| `rancher-ai-ui-chat-panel-not-ready` | `Chat.vue` | Dynamic: shows when not ready |
| `rancher-ai-ui-chat-message-box-{id}` | `Messages.vue` | Message IDs: 1=welcome, 2=first user msg, 3=first AI response |
| `rancher-ai-ui-context-tag-{label}` in message | `message/index.vue` | User messages display context tags (role=User + contextContent) |
| `rancher-ai-ui-chat-message-action-button-{resource.name}` | `message/action/Action.vue` | Dynamic testid; `resource.name` from `ActionResource.name` |
| `.chat-actions-container` | `message/action/index.vue` | Root container div for the actions block |
| `.chat-msg-action-title` | `message/action/index.vue` | Section heading above action buttons |
| `.chat-msg-action-tags` | `message/action/index.vue` | Wraps the action button list |
| `.chat-msg-actions-more` | `message/action/index.vue` | "Show more/less" toggle; present only when `actions.length > THRESHOLD (7)` |

## Selector Anti-Patterns

- **`.rc-dropdown-item`** — `RcDropdownItem` from `@components/RcDropdown` external library; CSS class unverifiable without source. Use `cy.contains('.context-dropdown', text)` instead or add `data-testid` to items.
- **`.be.disabled` on Vue components** — Don't use `.should('be.disabled')` on class names assigned to Vue component wrappers (e.g., `<rc-dropdown-trigger class="context-trigger">`). The component may not render a `<button>` root or may not forward the `disabled` attribute. Use CSS class checks (e.g., `.disabled-panel`) or `aria-disabled` attributes instead.

## Common Plan Issues

- Test 7 (disabled state): Checking `.be.disabled` on a Vue component class is risky. Always use verifiable CSS class (`.disabled-panel` exists on `.chat-context` in Context.vue).
- Context tags appear **inside user messages** (via `message/index.vue` when `role=User && contextContent?.length`) — `MessagePo.context(label)` searches the whole page via `.get()`, not scoped to message.
- Message ID order: 1 = welcome (AI), 2 = first user msg, 3 = first AI response.
- **Show-more mock**: Do NOT use `cy.enqueueLLMResponse({ tool })` to produce >7 action buttons — it queries the real cluster and the count is environment-dependent. Instead, use `cy.enqueueLLMResponse({ text: \`<mcp-response>${JSON.stringify([{kind,type,name:['a','b',...9],cluster,namespace}])}</mcp-response>\` })` to guarantee a deterministic count. The `name` field accepts an array; each entry becomes a separate button.
- **`<mcp-response>` format**: `formatMessageRelatedResourcesActions()` in `utils/format.ts` parses a JSON array of `{kind, type, name (string|string[]), cluster, namespace}` objects between `<mcp-response>…</mcp-response>` tags.

## Coverage Guidelines

- Context panel: test "No context" fallback (Home page), cluster tag auto-selection, dropdown add/remove, reset button, disabled state, and context not sent when deselected.
- **message-resource-actions**: test single resource button (getKubernetesResource), multiple buttons (listKubernetesResources), click-navigation, disabled button for unknown resource, section label display, show-more toggle (use text mock with >7 names in array), no-buttons for plain text response, history persistence.
- Always verify mock LLM response is enqueued before `chat.sendMessage()`.
- Use `cy.cleanChatHistory()` in `afterEach`.
- `MessagePo.context(label).should('not.exist')` works for verifying deselected context because it searches page-wide; after tag deselection, no `rancher-ai-ui-context-tag-{label}` exists anywhere in the DOM.
- Approved plan (context, Attempt 2): 8 test cases covering no-context home, cluster tag, dropdown open, remove/re-add tag, reset, disabled state, deselected context not sent.

## Page Objects

- `ClusterDashboardPagePo` — used in `chat.spec.ts`; import from `@rancher/cypress/e2e/po/pages/explorer/cluster-dashboard.po`
- `MessagePo` — in `cypress/e2e/po/message.po.ts`; `.context(label)` checks page-wide for context tag testid
- New PO classes go in `cypress/e2e/po/`
