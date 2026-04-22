# Selectors

Verified selector → component mappings. Organized by feature area.

### console

- `rancher-ai-ui-chat-console` → `components/panels/Console.vue`
- `rancher-ai-ui-chat-input-textarea` → `components/panels/Console.vue`
- `rancher-ai-ui-chat-panel-ready` → `pages/Chat.vue` (dynamic: `rancher-ai-ui-chat-panel-${ready|not-ready}`)
- `rancher-ai-ui-chat-message-box-{id}` → `components/panels/Messages.vue` (uses `message.id` from store)
- `rancher-ai-ui-chat-container` → `pages/Chat.vue`
- `rancher-ai-ui-multi-agent-select` → `components/agent/SelectAgent.vue`
- `.send-button` → `components/panels/Console.vue` (inside `.chat-input-complete`)
- `.chat-input-complete` → `components/panels/Console.vue` (wraps overlay + send button)
- `.chat-input-complete .text` → `components/panels/Console.vue` (ghost text overlay div)
- `.disabled-panel` → `components/panels/Console.vue` (applied when `props.disabled` is true)
- `.disclaimer` → `components/console/VerifyResultsDisclaimer.vue`
- `.disclaimer-section-title` → `components/console/VerifyResultsDisclaimer.vue`
- `.tab-label-box` → `components/panels/Console.vue`
- `.llm-model-label` → `components/console/LlmModelLabel.vue`
- `.textlabel-popper .inline-button` → `components/popover/TextLabel.vue`

### chat-panel-menu

- `.chat-console-menu-container` → `components/header/ChatPanelMenu.vue` (wrapper div)
- `.chat-console-menu-container button` or `.chat-console-menu-container .icon-actions` → `components/header/ChatPanelMenu.vue` (`rc-dropdown-trigger` wrapping `<i class="icon icon-actions">`, line 77)
- `.shortcuts` → `components/header/KeyboardShortcuts.vue`
- `.shortcuts-title` → `components/header/KeyboardShortcuts.vue`
- `.shortcuts-row` → `components/header/KeyboardShortcuts.vue` (each shortcut entry)
- `.shortcuts-action` → `components/header/KeyboardShortcuts.vue`
- `.shortcuts-key` → `components/header/KeyboardShortcuts.vue` (`<kbd>`)
- NOTE: `rancher-ai-ui-chat-menu-button` does NOT exist — use CSS selectors
- NOTE: `Header.vue` does NOT pass `disabled` prop to `ChatPanelMenu`

### message-summary

- `rancher-ai-ui-chat-message-formatted-content` → `components/message/index.vue` (`v-if` controlled)
- `.inline-button` → `components/message/index.vue` (thinking toggle + summary See More/Less)
- `.chat-msg-user-expanded` → `components/message/index.vue` (class on formatted-content span)
- `rancher-ai-ui-sliding-badge` → `handlers/hooks/overlay/badge-sliding.ts`
- i18n: `See More` / `See Less` (en-us.yaml lines 53–54)

### message-bubble-actions

- `.chat-msg-bubble` → `components/message/index.vue`
- `.chat-msg-bubble-actions` → `components/message/index.vue` (`v-if="!props.disabled"`; CSS opacity:0, 1 on hover)
- `.bubble-action-btn` → `components/message/BubbleButton.vue`
- `.bubble-action-btn .icon-copy` → BubbleButton (default copy state)
- `.bubble-action-btn .icon-checkmark` → BubbleButton (1-second copy success feedback)
- `.bubble-action-btn .icon-backup` → BubbleButton (resend, User messages only)
- `rancher-ai-ui-chat-message-show-thinking-button` → `components/message/index.vue` on BubbleButton
- `rancher-ai-ui-chat-message-formatted-content` → `components/message/index.vue`

### history-panel

- `rancher-ai-ui-chat-history-button` → `components/panels/Header.vue`
- `rancher-ai-ui-chat-history-panel` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-panel-overlay` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-header-button` → `components/history/HistoryHeader.vue`
- `rancher-ai-ui-chat-history-create-chat-button` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-chat-item-{N}` → `components/panels/History.vue` (0-based index)
- `rancher-ai-ui-chat-history-item-name` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-item-name-input` → `components/panels/History.vue`
- `rancher-ai-ui-chat-history-chat-item-menu-button` → `components/history/HistoryChatMenu.vue`
- `rancher-ai-ui-chat-history-chat-item-menu-button-option-rename-chat` → `HistoryChatMenu.vue`
- `rancher-ai-ui-chat-history-chat-item-menu-button-option-delete-chat` → `HistoryChatMenu.vue`
- `prompt-remove-confirm-button` → `dialog/DeleteChatCard.vue`
- `.focused` (CSS class) → `components/panels/History.vue`
- NOTE: `rancher-ai-ui-delete-chat-confirm-button` does NOT exist — use `prompt-remove-confirm-button`

### tool-confirmation

- `rancher-ai-ui-chat-message-confirmation-message` → `components/message/Confirmation.vue`
- `rancher-ai-ui-chat-message-confirmation-confirm-button` → `components/message/Confirmation.vue` (v-if: Pending)
- `rancher-ai-ui-chat-message-confirmation-cancel-button` → `components/message/Confirmation.vue` (v-if: Pending)
- `rancher-ai-ui-chat-message-confirmation-confirmed` → `components/message/Confirmation.vue` (v-if: Confirmed)
- `rancher-ai-ui-chat-message-confirmation-canceled` → `components/message/Confirmation.vue` (v-else-if: Canceled)

### multi-agent

- `rancher-ai-ui-multi-agent-select` → `components/agent/SelectAgent.vue` (root div)
- `rancher-ai-ui-multi-agent-select-option-{name}` → `SelectAgent.vue` (dynamic on `rc-dropdown-item`)
- `.agent-trigger` → `SelectAgent.vue` (class on `rc-dropdown-trigger`)
- `.selected-agent-name` → `SelectAgent.vue` (span inside trigger)
- `.icon-checkmark.hidden` → `SelectAgent.vue` (CSS `visibility: hidden`, always in DOM)
- `rancher-ai-ui-chat-message-selected-agent-label-{agentName}` → `components/message/index.vue`

### context

- `.context-select` → `SelectContext.vue` (`v-if="props.options.length > 0"`)
- `.context-trigger` → `SelectContext.vue` (`rc-dropdown-trigger`)
- `.context-dropdown` → `SelectContext.vue`
- `.context-reset` → `SelectContext.vue` (`v-if="options.length !== selected.length"`)
- `.no-context` → `SelectContext.vue` (`v-else`, `span.text-muted`)
- `.chat-context` → `Context.vue` (root div)
- `rancher-ai-ui-context-tag-{value}` → `ContextTag.vue` inner `.tag-content` div
- `button.vs__deselect` → `ContextTag.vue` (v-if: `removeEnabled=true`)
- `.vs__selected.tag` → `ContextTag.vue` root element
- `.user-context` → `ContextTag.vue` (class when `type==='user'`)
- `.chat-msg-user-context-tags` → `components/message/index.vue`
- `.chat-msg-user-context-tag` → `components/message/index.vue`
- `.suggestions-container` → `Suggestions.vue`
- `rancher-ai-ui-chat-message-suggestion-{N}` → `Suggestions.vue` (0-based)
- `.chat-source-container` → `SourceLinks.vue`
- `.chat-msg-source-label` → `SourceLinks.vue` (i18n: "SOURCE")
- `rancher-ai-ui-chat-message-source-link-{N}` → `SourceLinks.vue`

## Component Mapping

| Feature Area | Key Components |
|---|---|
| `console` | `Console.vue`, `LlmModelLabel.vue`, `VerifyResultsDisclaimer.vue`, `TextLabel.vue`, `useInputComposable.ts` |
| `message-bubble-actions` | `message/index.vue`, `BubbleButton.vue`, `useInputComposable.ts` |
| `chat-panel-menu` | `ChatPanelMenu.vue`, `Header.vue`, `KeyboardShortcuts.vue`, `TextLabel.vue`, `Chat.vue` |
| `history-panel` | `History.vue`, `Header.vue`, `HistoryHeader.vue`, `HistoryChatMenu.vue`, `DeleteChatCard.vue` |
| `tool-confirmation` | `Confirmation.vue`, `Console.vue`, `Messages.vue`, `Chat.vue` |
| `multi-agent` | `SelectAgent.vue`, `Console.vue`, `message/index.vue`, `useAgentComposable.ts` |
| `message-summary` | `message/index.vue`, `badge-sliding.ts`, `template-message.ts`, `useChatMessageComposable.ts` |
| `context` | `SelectContext.vue`, `ContextTag.vue`, `Context.vue`, `useContextComposable.ts`, `Suggestions.vue`, `SourceLinks.vue` |
| `keyboard-shortcuts` | `KeyboardShortcuts.vue`, `ChatPanelMenu.vue`, `useKeyboardShortcutsComposable.ts`, `dialog/DeleteChatCard.vue` |
