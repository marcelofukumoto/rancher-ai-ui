# E2E Generic Learnings

## Infrastructure
- Empty cypress-output.txt: Check metadata.json outcome field; infer tests from screenshot names (format: `<feature>-test-<N>-<description>.png`).
- Empty output likely means Cypress runner timed out or crashed before emitting logs; screenshots are still captured on failure.
- Always dispatch fixer when outcome=failure even without error details.

## context spec (PR #11)
- Tests (8 total): cluster-context-tag-visible, no-context-home-page, context-tag-removed, context-reset, context-added-via-dropdown, context-in-message, context-disabled-during-processing, namespace-context-tag
- **ALL 8 TESTS PASSED** — confirmed passing on 2026-03-31 (attempt 1, run_id 23774492476). Spec is stable.
- Test durations range from ~2.9s to ~9.5s; total spec duration ~38s.
- Selector fix: `.should('be.visible')` → `.scrollIntoView().should('exist')` for `[data-testid="rancher-ai-ui-context-tag-local"]`
- `aiMessage.context()` should be on `userMessage` (context tags shown on user messages, not AI messages)
- `.context-reset.should('be.visible')` → `.should('exist')`; `.chat-context.should('be.visible')` → `.should('exist')`
- ContextTag.vue: data-testid is on inner `div.tag-content`, `.vs__deselect` is sibling button inside parent `div.vs__selected.tag`
- `WorkloadsDeploymentsListPagePo` does NOT exist in @rancher/cypress v1.0.5 — causes spec-load crash (ALL tests fail, empty output). Use `ClusterDashboardPagePo` instead.
- `.no-context` class DOES exist in SelectContext.vue (`v-else` span when options.length===0) — use `.should('exist')` not `.should('be.visible')`
- Past persistent issue: empty cypress-output.txt with spec crashes was caused by wrong imports (WorkloadsDeploymentsListPagePo). Fix: use ClusterDashboardPagePo.

## Anti-patterns
- Don't skip fixer dispatch when log is empty but outcome=failure
- Don't try to read PNG screenshot files
- Don't assume selector fixes alone are sufficient when ALL tests fail with empty output (may be a module/import error)
- Don't assume import fix solves the crash if empty output persists — check TypeScript syntax, custom command registration, and PO method signatures
- `WorkloadsDeploymentsListPagePo` is not available in @rancher/cypress v1.0.5 — always use `ClusterDashboardPagePo` for navigation to cluster dashboard
