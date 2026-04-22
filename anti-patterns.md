# Anti-Patterns

Things that don't work. Each entry includes the wrong approach and the correct alternative.

## Keyboard Events (Cypress)

- Do NOT use `.type('{uparrow}')` or `.type('{downarrow}')` expecting Vue keydown handlers to fire — use `.trigger('keydown', { key: 'ArrowUp', keyCode: 38, which: 38, code: 'ArrowUp' })` instead
- Do NOT use `.type('{tab}')` for autocomplete — use `.trigger('keydown', { key: 'Tab', keyCode: 9, which: 9, code: 'Tab' })`
- After triggering keydown, add `cy.wait(100)` before asserting textarea value

## Disabled State During Streaming

- Do NOT assert `.disabled-panel` or `textarea[disabled]` during `GeneratingResponse` (streaming) phase — the console is NOT disabled during streaming
- `Chat.vue` `disabled` computed only activates for: `AwaitingConfirmation`, `systemErrors.length > 0`, or `aiAgentDeploymentState !== Active`
- Source: `Chat.vue` line 149–153

## Message Content Assertions

- Do NOT assert `chat.getMessage(N).content()` to check thinking visibility — `content()` returns only `rancher-ai-ui-chat-message-formatted-content` (never contains thinking text); use `containsText()` or `cy.contains()` scoped to the message box instead
- Do NOT describe `{uparrow}` as changing the textarea value — it fills `.chat-input-complete .text` overlay (ghost text), NOT the textarea `.value`

## Selectors That Don't Exist

- `rancher-ai-ui-chat-menu-button` does NOT exist — use `.chat-console-menu-container button`
- `rancher-ai-ui-delete-chat-confirm-button` does NOT exist — use `prompt-remove-confirm-button`

## Mock API

- Do NOT use `PUT` for `/v1/control/push` — correct method is `POST` (verified in `cypress/support/commands/llm-mock-service-api.ts`)
- Do NOT use `http://localhost:1080/mockserver/expectation` — use Rancher proxy path: `POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push`

## Test Design

- Do NOT use `chunkSize: 5` or higher for "disabled while processing" tests — use `chunkSize: 1` with long text for reliable timing
- Do NOT hardcode message IDs without documenting the full message sequence in preconditions
- Do NOT use `.v-popper__inner` as primary popover selector — prefer component-specific classes like `.disclaimer`
- Do NOT use close button (`rancher-ai-ui-chat-close-button`) as an outside-click target for dropdown dismiss tests — it closes the entire chat panel; use `.chat-container.click(10, 200)` instead
- Do NOT assume history panel stays open after clicking a chat item — it always auto-closes

## Visibility Assertions

- Use `.should('exist')` not `.should('be.visible')` for context-related elements
- `formattedContent` uses `v-if` (not `v-show`) → assert `.should('not.exist')` when hidden, not `.should('be.hidden')`
- `.chat-msg-bubble-actions` is controlled by `v-if="!props.disabled"` — when disabled, it's removed from DOM entirely

## Infrastructure

- Empty `cypress-output.txt`: check metadata outcome; infer tests from screenshot names
- Always dispatch fixer when outcome=failure even without error details
- Don't read PNG files; don't skip fixer when log is empty but outcome=failure
- Don't assume selector fix is enough when ALL tests fail (may be import/module error)

## Menu Item Labels (keyboard-shortcuts / ChatPanelMenu)

- Do NOT use `AI settings` to find the config menu item — actual label is `Edit Configuration` (en-us.yaml line 219). Use `"Edit Configuration"` as primary text.
- Do NOT use `Keyboard shortcuts` (lowercase s) as primary text — actual label is `View Keyboard Shortcuts` (en-us.yaml line 221). Substring match on `Keyboard Shortcuts` works.
