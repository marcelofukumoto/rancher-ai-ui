# E2E Generic Learnings

## Infrastructure
- Empty cypress-output.txt: check metadata outcome; infer tests from screenshot names.
- Always dispatch fixer when outcome=failure even without error details.

## context spec — STABLE (all 8 tests pass, run 23774492476)
- Tests: cluster-context-tag, no-context-home, tag-removed, context-reset, dropdown-add, context-in-message, disabled-during-processing, namespace-context
- Use `.should('exist')` not `.should('be.visible')` for context-related elements
- Use `ClusterDashboardPagePo` — `WorkloadsDeploymentsListPagePo` not in @rancher/cypress v1.0.5
- Context tags are on `userMessage`, not `aiMessage`
- ContextTag data-testid on inner `div.tag-content`; `.vs__deselect` sibling inside `div.vs__selected.tag`

## Anti-patterns
- Don't read PNG files; don't skip fixer when log is empty but outcome=failure
- Don't assume selector fix is enough when ALL tests fail (may be import/module error)
