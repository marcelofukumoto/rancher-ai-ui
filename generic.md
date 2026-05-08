# E2E Generic Learnings

## Selector Corrections

- **URL navigation assertions**: Rancher URLs follow the pattern `/c/local/explorer/{resource-type}/{namespace}/{name}`. Tests asserting `.include('/local/{resource-type}/')` will fail — always include the full path: `/c/local/explorer/{resource-type}/`.
- **Chat message box selector**: `[data-testid="rancher-ai-ui-chat-message-box-{index}"]` — may not be set on history messages. Verify history reload logic preserves `data-testid`.
- **Show more toggle**: `.chat-msg-actions-more` — check actual CSS class name in the component; may differ from spec assumption.
- **Unknown resource button**: `[data-testid^="rancher-ai-ui-chat-message-action-button-{resource-name}"]` — disabled buttons for unknown resources may not render at all or may use a different selector pattern.

## Common Failure Patterns

- URL pattern mismatch: test expects shortened URL without `/c/` prefix and `/explorer/` segment; actual Rancher URLs always include these.
- Missing `data-testid` on history/revisited chat messages — component may not re-attach attributes after history load.
- "Show more" feature elements not present — feature may not be implemented or CSS class differs.
- Element not found for unknown/nonexistent resources — buttons may not be rendered at all for unknown resources.

## Cypress Best Practices

- Use `cy.url().should('include', ...)` with the full Rancher URL path including `/c/local/explorer/`.
- For history-based tests, add explicit waits or intercept network requests to ensure history is fully loaded before asserting.
- When testing disabled state, check whether the button renders at all vs. being rendered with `disabled` attribute.

## Feature-Specific Notes (message-resource-actions)

- Tests 1, 2, 5, 7 pass consistently — basic rendering and absence checks work.
- Tests 3, 4, 6, 8 fail in attempt 1 — URL pattern, unknown resource rendering, "show more" toggle, and history persistence need fixes.

## Anti-Patterns

- Asserting partial URL without the `/c/local/explorer/` prefix in Rancher navigation tests.
- Assuming `data-testid` is preserved after chat history reload without verifying component re-render.
