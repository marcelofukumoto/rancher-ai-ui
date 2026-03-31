# Generic (overflow notes)

See e2e-generic.learning.md for full learnings.

## console Feature — Observed Failures (2026-03-31, Attempt 1)

### Common Failure Patterns

- **`[data-teststatus="rancher-ai-ui-chat-message-status-2-completed"]` never found**: Tests 1–4 (prompt history and tab autocomplete) all fail waiting for the second message's completed status. The index `2` in the attribute suggests a 1-based or 0-based message counter that may not be set, or messages beyond index 1 do not get a `completed` teststatus. Investigate whether `RawMessagePo.isCompleted` uses the correct index and whether the mock AI responds with a second message.
- **`<textarea.chat-input>` not disabled during processing**: Test 6 expects the textarea to gain a `disabled` attribute while AI is processing. If the UI uses a different mechanism (e.g., CSS class, pointer-events, or a Vue reactive property that doesn't map to the HTML `disabled` attribute), the assertion will fail.

### Selector / Attribute Corrections

- `data-teststatus` on message elements uses index suffix (e.g., `-2-completed`). Verify the correct index (0-based vs 1-based) and whether the attribute is applied by the message component.
- For disabled state on `textarea.chat-input`, check if the element actually receives `disabled` HTML attribute vs. a CSS class like `.is-disabled`.

### Cypress Best Practices

- When multiple tests fail with the same root cause (element not found), fix the underlying attribute/selector rather than increasing timeouts.
- Use `cy.should('have.attr', 'disabled')` only if the DOM attribute is actually set; otherwise use `.should('be.disabled')` or check the Vue component prop.
