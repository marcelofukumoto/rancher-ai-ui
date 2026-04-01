# MCP Test Plan: context

- **Feature Area**: context
- **Date Created**: 2026-04-01
- **Execution Method**: MCP Playwright
- **Plan Type**: Initial
- **Source Components Analyzed**:
  - `pkg/rancher-ai-ui/components/context/SelectContext.vue`
  - `pkg/rancher-ai-ui/components/context/ContextTag.vue`
  - `pkg/rancher-ai-ui/components/panels/Context.vue`
  - `pkg/rancher-ai-ui/composables/useContextComposable.ts`
  - `pkg/rancher-ai-ui/store/context.ts`
  - `pkg/rancher-ai-ui/components/message/Suggestions.vue`
  - `pkg/rancher-ai-ui/components/message/SourceLinks.vue`

---

## Prerequisites

- **Application URL**: `https://localhost:8005`
- **Login credentials**: username `admin`, password `password`
- **Self-signed certificate**: Configure Playwright to ignore HTTPS errors
  (`ignoreHTTPSErrors: true`)
- **LLM mock service URL** (via Rancher proxy):
  `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy`
- **Enqueue endpoint**: POST to `{mock-url}/v1/control/push`
- **Clear endpoint**: POST to `{mock-url}/v1/control/clear`
- **Auth**: All mock API requests must include the `R_SESS` session cookie obtained
  after login. Use Playwright's `request` API (with `ignoreHTTPSErrors: true`) and
  set `Cookie: R_SESS=<value>` on every mock API request.
- **Navigation for cluster context**: Navigate to
  `https://localhost:8005/c/local/explorer` to activate the `cluster:local` context
  tag. The context store computes cluster context from the `currentCluster` store
  getter when the current path contains `/c/<cluster-name>`.
- **Navigation for no-context state**: Navigate to `https://localhost:8005/home`
  — no cluster is active so the context array is empty.

---

## Known Selectors

| Selector | Source | Notes |
|---|---|---|
| `.context-select` | `components/context/SelectContext.vue` | Wrapper div shown only when `options.length > 0` |
| `.context-trigger` | `components/context/SelectContext.vue` | `rc-dropdown-trigger` (renders as `<button>`) |
| `.context-trigger-text` | `components/context/SelectContext.vue` | Text span inside trigger |
| `.context-dropdown` | `components/context/SelectContext.vue` | `RcDropdown` wrapper |
| `.context-reset` | `components/context/SelectContext.vue` | Visible when `options.length !== selected.length` |
| `.no-context` | `components/context/SelectContext.vue` | Shown when `options.length === 0` |
| `.chat-context` | `components/panels/Context.vue` | Outer wrapper; gets `.disabled-panel` when disabled |
| `[data-testid="rancher-ai-ui-context-tag-{value}"]` | `components/context/ContextTag.vue` | `value` is `valueLabel \|\| value` of the Context item (e.g. `local` for the local cluster) |
| `button.vs__deselect` | `components/context/ContextTag.vue` | X button inside a context tag; present when `removeEnabled=true` (panel tags only) |
| `.chat-msg-user-context-tags` | `components/message/index.vue` | Section wrapping context tags in a user message bubble |
| `.chat-msg-user-context-tag` | `components/message/index.vue` | CSS class on each `ContextTag` in a user message; `remove-enabled=false`, `type="user"` |
| `.suggestions-container` | `components/message/Suggestions.vue` | Container for the suggestions list |
| `[data-testid="rancher-ai-ui-chat-message-suggestion-{N}"]` | `components/message/Suggestions.vue` | Each suggestion button (0-based index) |
| `.chat-source-container` | `components/message/SourceLinks.vue` | Container for source links |
| `[data-testid="rancher-ai-ui-chat-message-source-link-{N}"]` | `components/message/SourceLinks.vue` | Each source link tag (0-based index, on root of `ContextTag` component) |

---

## Message ID Reference

- Message IDs come from `store/chat.ts` — `msgIdCnt` starts at `0`, incremented per message.
- Message 1 → Welcome message (AI, sent by the frontend automatically on chat open).
- Message 2 → First user message.
- Message 3 → AI response to message 2.
- Message 4 → Second user message (or suggestion click).
- Selector pattern: `[data-testid="rancher-ai-ui-chat-message-box-{id}"]`

---

## Mock API Quick Reference

**Enqueue a simple text response (single chunk):**
```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Content-Type: application/json
Cookie: R_SESS=<session-token>

{
  "agent": "rancher",
  "text": { "chunks": ["Hello! How can I help you?"] }
}
```

**Enqueue a response with suggestions:**
```json
{
  "agent": "rancher",
  "text": {
    "chunks": [
      "I'm ready to help! ",
      "<suggestion>View all pods</suggestion>",
      "<suggestion>Analyze logs</suggestion>",
      "<suggestion>Check node health</suggestion>"
    ]
  }
}
```

**Enqueue a response with source links:**
```json
{
  "agent": "rancher",
  "text": {
    "chunks": [
      "Here are some docs: ",
      "<mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink>",
      "<mcp-doclink>https://www.rancher.com/products/rancher-platform</mcp-doclink>"
    ]
  }
}
```

**Clear all enqueued responses:**
```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear
Content-Type: application/json
Cookie: R_SESS=<session-token>
```

---

## Test Cases

---

### Test 1: Context panel displays cluster context tag on a cluster page

**Description**: Verifies that when the user navigates to a cluster-level page and
opens the chat panel, the context panel displays the active cluster as a context tag.

**Preconditions**:
- User is logged in to `https://localhost:8005`
- Chat panel is closed

**Steps**:
1. Navigate to `https://localhost:8005`; wait for the login page.
2. Fill in the username field with `admin` and the password field with `password`; click
   the "Log In" button.
3. After login, wait for the Rancher home page to load.
4. Enqueue a mock welcome response: POST to the enqueue endpoint (see Mock API Quick
   Reference) with body:
   ```json
   { "agent": "rancher", "text": { "chunks": ["Hello! How can I help you?"] } }
   ```
5. Navigate to `https://localhost:8005/c/local/explorer`.
6. Wait for the page to load (look for Explorer navigation items or the cluster name
   "local" in the header).
7. Press `Alt+K` to open the chat panel.
8. Wait for the element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible
   (up to 30 seconds).
9. Take a screenshot named `context-mcp-test-1-cluster-context-panel`.

**Assertions**:
- The element `.context-select` exists and is visible inside the chat panel.
- The element `.context-trigger` (the context dropdown trigger button) is visible.
- The element `[data-testid="rancher-ai-ui-context-tag-local"]` is visible — this is
  the cluster context tag for the "local" cluster.
- The `.no-context` element does NOT exist (or is not visible).

**Selectors**: `.context-select`, `.context-trigger`,
`[data-testid="rancher-ai-ui-context-tag-local"]`, `.no-context`

**Screenshot**: `context-mcp-test-1-cluster-context-panel`

---

### Test 2: Context panel shows "No context" text on home page

**Description**: Verifies that when the user is on the Rancher home page (no cluster
selected), the context panel shows "No context" because the context store returns an
empty array (no active cluster, no namespace filter).

**Preconditions**:
- User is logged in
- Chat panel is closed

**Steps**:
1. Log in as `admin` / `password` if not already logged in.
2. Enqueue a mock welcome response:
   ```json
   { "agent": "rancher", "text": { "chunks": ["Hello! How can I help you?"] } }
   ```
3. Navigate to `https://localhost:8005/home`.
4. Wait for the home page to load.
5. Press `Alt+K` to open the chat panel.
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible.
7. Take a screenshot named `context-mcp-test-2-no-context`.

**Assertions**:
- The element `.no-context` is visible and contains the text "No context".
- The element `.context-select` is NOT visible (dropdown UI is hidden when options are
  empty, replaced by `.no-context` span).

**Selectors**: `.no-context`, `.context-select`

**Screenshot**: `context-mcp-test-2-no-context`

---

### Test 3: Deselect a context item via the context dropdown

**Description**: Verifies that the user can open the context dropdown and click an
item to deselect it, causing its context tag to disappear from the panel.

**Preconditions**:
- User is logged in
- Chat panel is open on `https://localhost:8005/c/local/explorer`
- Cluster context tag `[data-testid="rancher-ai-ui-context-tag-local"]` is visible

**Steps**:
1. Complete steps 1–8 from Test 1 (navigate to cluster explorer page and open chat).
2. Confirm that `[data-testid="rancher-ai-ui-context-tag-local"]` is visible.
3. Click the element `.context-trigger` to open the context dropdown.
4. Wait for the dropdown items to appear. Look for a dropdown item containing the text
   `cluster:local` (each item renders as `{tag}:{label}`).
5. Click the dropdown item containing `cluster:local` to deselect the cluster context.
6. Click outside the dropdown (e.g., on the chat console area
   `[data-testid="rancher-ai-ui-chat-console"]`) to close the dropdown.
7. Take a screenshot named `context-mcp-test-3-context-deselected`.

**Assertions**:
- After clicking the dropdown item, `[data-testid="rancher-ai-ui-context-tag-local"]`
  is no longer visible in the context panel.
- The `.context-reset` button becomes visible (because `options.length !== selected.length`).

**Selectors**: `.context-trigger`, `.context-reset`,
`[data-testid="rancher-ai-ui-context-tag-local"]`

**Screenshot**: `context-mcp-test-3-context-deselected`

---

### Test 4: Remove a context tag via its X (deselect) button

**Description**: Verifies that the user can remove an individual context tag by
clicking the X button (`.vs__deselect`) on the tag directly, without using the dropdown.

**Preconditions**:
- User is logged in
- Chat panel is open on `https://localhost:8005/c/local/explorer`
- Cluster context tag `[data-testid="rancher-ai-ui-context-tag-local"]` is visible

**Steps**:
1. Complete steps 1–8 from Test 1.
2. Confirm that `[data-testid="rancher-ai-ui-context-tag-local"]` is visible.
3. Locate the tag's parent `.vs__selected.tag` element that contains
   `[data-testid="rancher-ai-ui-context-tag-local"]`.
4. Within that `.vs__selected.tag` element, click the `button.vs__deselect` button
   (the X button). This button is the sibling of the `.tag-content` div.
5. Take a screenshot named `context-mcp-test-4-tag-x-removed`.

**Assertions**:
- After clicking `.vs__deselect`, `[data-testid="rancher-ai-ui-context-tag-local"]` is
  no longer visible.
- The `.context-reset` button is now visible (because the item was removed from the
  selection but is still in the options list).

**Implementation Notes**:
- The `.vs__deselect` button may require `{ force: true }` if it is hidden by
  default and only shows on hover. Try hovering over the `.vs__selected.tag` element
  first, then clicking `.vs__deselect`.
- Alternative selector approach: find the `.vs__selected.tag` that contains
  `[data-testid="rancher-ai-ui-context-tag-local"]`, then click its child
  `button.vs__deselect`.

**Selectors**: `[data-testid="rancher-ai-ui-context-tag-local"]`,
`.vs__selected.tag`, `button.vs__deselect`, `.context-reset`

**Screenshot**: `context-mcp-test-4-tag-x-removed`

---

### Test 5: Reset context restores all deselected tags

**Description**: Verifies that after deselecting context items, clicking the Reset
button (`.context-reset`) restores all context tags to their default (all selected) state.

**Preconditions**:
- User is logged in
- Chat panel is open on `https://localhost:8005/c/local/explorer`
- At least one context item has been deselected (cluster tag removed)

**Steps**:
1. Complete steps 1–6 from Test 4 to remove the cluster context tag.
2. Verify `.context-reset` button is visible.
3. Click the button inside `.context-reset` (the Reset button has text "Reset" and an
   `icon-refresh` icon). Specifically, click `button` inside `.context-reset`.
4. Wait ~300ms for the UI to update.
5. Take a screenshot named `context-mcp-test-5-context-reset`.

**Assertions**:
- After clicking Reset, `[data-testid="rancher-ai-ui-context-tag-local"]` is visible
  again (cluster tag restored).
- The `.context-reset` button is no longer visible (all options are selected again,
  so `options.length === selected.length` → reset button hidden).

**Selectors**: `.context-reset`, `[data-testid="rancher-ai-ui-context-tag-local"]`

**Screenshot**: `context-mcp-test-5-context-reset`

---

### Test 6: Context tags appear in the user message bubble when sending a message

**Description**: Verifies that when the user sends a message while context tags are
active, the resulting user message bubble includes the context tags rendered as small
tag chips (`.chat-msg-user-context-tag`). This confirms `contextContent` is captured
at send time and stored with the message.

**Preconditions**:
- User is logged in
- Chat panel is closed
- The application is on `https://localhost:8005/c/local/explorer` (cluster context active)

**Message sequence**:
- Message 1: Welcome message (AI)
- Message 2: User message "Tell me about this cluster"
- Message 3: AI response

**Steps**:
1. Log in as `admin` / `password`.
2. Enqueue **two** mock responses (welcome + user response):
   - First enqueue: `{ "agent": "rancher", "text": { "chunks": ["Hello! How can I help you?"] } }`
   - Second enqueue: `{ "agent": "rancher", "text": { "chunks": ["Here is information about the local cluster."] } }`
3. Navigate to `https://localhost:8005/c/local/explorer`.
4. Wait for the page to load.
5. Press `Alt+K` to open the chat panel.
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible.
7. Wait for the welcome message `[data-testid="rancher-ai-ui-chat-message-box-1"]` to
   be present.
8. Click on `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type
   `Tell me about this cluster`.
9. Press `Enter` to send the message.
10. Wait for the user message `[data-testid="rancher-ai-ui-chat-message-box-2"]` to appear.
11. Take a screenshot named `context-mcp-test-6-context-in-user-message`.

**Assertions**:
- Within `[data-testid="rancher-ai-ui-chat-message-box-2"]`:
  - The element `.chat-msg-user-context-tags` is visible (context tags section exists).
  - The element `[data-testid="rancher-ai-ui-context-tag-local"]` is visible inside
    `.chat-msg-user-context-tags` — confirming the cluster context was attached to
    the message at send time.
  - The context tag has CSS class `user-context` (because `type="user"` is set in
    `message/index.vue`).
  - The context tag does NOT have a `.vs__deselect` button (because `remove-enabled`
    is `false` for context tags in message bubbles).

**Selectors**:
`[data-testid="rancher-ai-ui-chat-message-box-2"]`,
`.chat-msg-user-context-tags`,
`[data-testid="rancher-ai-ui-context-tag-local"]`,
`.user-context`,
`button.vs__deselect`

**Screenshot**: `context-mcp-test-6-context-in-user-message`

---

### Test 7: AI response with `<suggestion>` tags renders clickable suggestion buttons

**Description**: Verifies that when the AI's response stream contains
`<suggestion>...</suggestion>` tags, the frontend parses them and renders interactive
suggestion buttons in the message bubble. The suggestion text is stripped from the
message content and displayed only as button labels.

**Preconditions**:
- User is logged in
- Chat panel is closed

**Message sequence**:
- Message 1: Welcome message (AI) — contains suggestions

**Steps**:
1. Log in as `admin` / `password`.
2. Enqueue a mock welcome response **before opening the chat panel**:
   ```json
   {
     "agent": "rancher",
     "text": {
       "chunks": [
         "I'm Liz, your personal AI assistant. How can I help you? ",
         "<suggestion>View all pods</suggestion>",
         "<suggestion>Analyze cluster logs</suggestion>",
         "<suggestion>Check node health</suggestion>"
       ]
     }
   }
   ```
3. Navigate to `https://localhost:8005/home`.
4. Wait for the home page to load.
5. Press `Alt+K` to open the chat panel.
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible.
7. Wait for the welcome message `[data-testid="rancher-ai-ui-chat-message-box-1"]` to
   be present and its content to stop updating (wait for response to complete streaming).
8. Take a screenshot named `context-mcp-test-7-suggestions`.

**Assertions**:
- Within `[data-testid="rancher-ai-ui-chat-message-box-1"]`:
  - The element `.suggestions-container` is visible.
  - The element `[data-testid="rancher-ai-ui-chat-message-suggestion-0"]` is visible
    and contains the text "View all pods".
  - The element `[data-testid="rancher-ai-ui-chat-message-suggestion-1"]` is visible
    and contains the text "Analyze cluster logs".
  - The element `[data-testid="rancher-ai-ui-chat-message-suggestion-2"]` is visible
    and contains the text "Check node health".
  - The `<suggestion>` tags themselves are NOT visible as literal text in the message
    content `[data-testid="rancher-ai-ui-chat-message-formatted-content"]`.

**Selectors**:
`[data-testid="rancher-ai-ui-chat-message-box-1"]`,
`.suggestions-container`,
`[data-testid="rancher-ai-ui-chat-message-suggestion-0"]`,
`[data-testid="rancher-ai-ui-chat-message-suggestion-1"]`,
`[data-testid="rancher-ai-ui-chat-message-suggestion-2"]`,
`[data-testid="rancher-ai-ui-chat-message-formatted-content"]`

**Screenshot**: `context-mcp-test-7-suggestions`

---

### Test 8: Clicking a suggestion button sends it as a new user message

**Description**: Verifies that clicking a suggestion button in an AI message causes
the suggestion text to be sent as a new user message. The suggestion click calls
`emit('select', suggestion)` → `sendMessage(suggestion)` internally.

**Preconditions**:
- Test 7 setup is complete — the welcome message (message 1) contains suggestion buttons.
- An additional mock response must be enqueued to handle the AI reply to the
  suggestion-triggered user message.

**Message sequence**:
- Message 1: Welcome message (AI) — with suggestions
- Message 2: User message (from clicking suggestion) — "View all pods"
- Message 3: AI response to suggestion

**Steps**:
1. Complete steps 1–7 from Test 7 (welcome message with suggestions is visible).
2. Before clicking the suggestion, enqueue a mock response for the AI reply:
   ```json
   { "agent": "rancher", "text": { "chunks": ["Here are the pods in your cluster."] } }
   ```
3. Click `[data-testid="rancher-ai-ui-chat-message-suggestion-0"]` (the "View all pods"
   suggestion button) with `{ force: true }` if needed.
4. Wait for the new user message `[data-testid="rancher-ai-ui-chat-message-box-2"]` to
   appear.
5. Wait for the AI response `[data-testid="rancher-ai-ui-chat-message-box-3"]` to
   appear and complete.
6. Take a screenshot named `context-mcp-test-8-suggestion-click-sends`.

**Assertions**:
- `[data-testid="rancher-ai-ui-chat-message-box-2"]` exists and is visible.
- The user message (message 2) contains the text "View all pods".
- `[data-testid="rancher-ai-ui-chat-message-box-3"]` exists and contains "Here are the
  pods in your cluster."

**Selectors**:
`[data-testid="rancher-ai-ui-chat-message-suggestion-0"]`,
`[data-testid="rancher-ai-ui-chat-message-box-2"]`,
`[data-testid="rancher-ai-ui-chat-message-box-3"]`

**Screenshot**: `context-mcp-test-8-suggestion-click-sends`

---

### Test 9: Source links in AI response are rendered as clickable tags

**Description**: Verifies that when the AI's response contains
`<mcp-doclink>URL</mcp-doclink>` tags, the frontend parses them and renders source link
tags in a collapsible `.chat-source-container` section. The URL path segments are
converted to a human-readable label via `toLinkLabel()`.

**Preconditions**:
- User is logged in
- Chat panel is closed

**Message sequence**:
- Message 1: Welcome message (AI)
- Message 2: User message "Provide documentation links about Rancher"
- Message 3: AI response with source links

**Steps**:
1. Log in as `admin` / `password`.
2. Enqueue a mock welcome response:
   ```json
   { "agent": "rancher", "text": { "chunks": ["Hello! How can I help you?"] } }
   ```
3. Navigate to `https://localhost:8005/home`.
4. Wait for the home page to load.
5. Press `Alt+K` to open the chat panel.
6. Wait for `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible.
7. Wait for welcome message `[data-testid="rancher-ai-ui-chat-message-box-1"]` to
   complete streaming.
8. Enqueue a mock response with source links:
   ```json
   {
     "agent": "rancher",
     "text": {
       "chunks": [
         "Here are some documentation links about Rancher: ",
         "<mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink>",
         "<mcp-doclink>https://www.rancher.com/products/rancher-platform</mcp-doclink>"
       ]
     }
   }
   ```
9. Click on `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type
   `Provide documentation links about Rancher`.
10. Press `Enter` to send the message.
11. Wait for `[data-testid="rancher-ai-ui-chat-message-box-3"]` to appear and complete.
12. Take a screenshot named `context-mcp-test-9-source-links`.

**Assertions**:
- Within `[data-testid="rancher-ai-ui-chat-message-box-3"]`:
  - The `.chat-source-container` element is visible.
  - The `.chat-msg-source-label` element is visible and contains the text "SOURCE".
  - The element `[data-testid="rancher-ai-ui-chat-message-source-link-0"]` is visible
    and contains the label text derived from the first URL ("Why Rancher" — produced by
    `toLinkLabel("https://www.rancher.com/why-rancher")`).
  - The element `[data-testid="rancher-ai-ui-chat-message-source-link-1"]` is visible
    and contains a label derived from the second URL ("Rancher Platform").
  - The `<mcp-doclink>` tags are NOT visible as literal text in
    `[data-testid="rancher-ai-ui-chat-message-formatted-content"]`.

**Implementation Notes**:
- The `toLinkLabel` function (from `pkg/rancher-ai-ui/utils/label.ts`) converts a URL
  to a human-readable label by extracting the last meaningful path segment. For
  `https://www.rancher.com/why-rancher` it produces "Why Rancher". For
  `https://www.rancher.com/products/rancher-platform` it produces "Rancher Platform".
- The `data-testid="rancher-ai-ui-chat-message-source-link-0"` is applied to the root
  `div.vs__selected.tag` element of the `ContextTag` component (via Vue attribute
  inheritance). The inner `.tag-content` div will have a different `data-testid`
  (the URL-derived label value). Use the outer wrapper selector for reliability.

**Selectors**:
`[data-testid="rancher-ai-ui-chat-message-box-3"]`,
`.chat-source-container`,
`.chat-msg-source-label`,
`[data-testid="rancher-ai-ui-chat-message-source-link-0"]`,
`[data-testid="rancher-ai-ui-chat-message-source-link-1"]`,
`[data-testid="rancher-ai-ui-chat-message-formatted-content"]`

**Screenshot**: `context-mcp-test-9-source-links`

---

## Mock Data Setup Summary

| Test | Enqueues | Body (abbreviated) |
|------|----------|---------------------|
| 1 | 1 (welcome) | `{ "agent": "rancher", "text": { "chunks": ["Hello! How can I help you?"] } }` |
| 2 | 1 (welcome) | same as Test 1 |
| 3 | 1 (welcome) | same as Test 1 |
| 4 | 1 (welcome) | same as Test 1 |
| 5 | 1 (welcome) | same as Test 1 |
| 6 | 2 (welcome + user reply) | welcome: plain text; user reply: `"Here is information about the local cluster."` |
| 7 | 1 (welcome with suggestions) | `"I'm Liz... <suggestion>View all pods</suggestion><suggestion>Analyze cluster logs</suggestion><suggestion>Check node health</suggestion>"` |
| 8 | 2 (welcome with suggestions + suggestion reply) | welcome: same as Test 7; suggestion reply: `"Here are the pods in your cluster."` |
| 9 | 2 (welcome + source-link reply) | welcome: plain text; reply: `"Here are some documentation links... <mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink><mcp-doclink>https://www.rancher.com/products/rancher-platform</mcp-doclink>"` |

---

## General Notes for the MCP Executor

- **Clear mock responses** between tests: POST to the clear endpoint before each test
  to avoid stale enqueued responses from a previous run.
- **Wait for streaming to complete** before asserting message content: watch for the
  completion indicator (no active streaming animation, or wait for a fixed timeout of
  ~2–3 seconds after the last chunk).
- **Animation delays**: After pressing `Alt+K`, wait ~500ms for the panel animation
  before interacting.
- **Force clicks**: Some buttons (`.vs__deselect`, suggestion buttons) may need
  `{ force: true }` due to CSS opacity transitions.
- **Session cookie**: Obtain the `R_SESS` cookie value after login using
  `page.context().cookies()` and pass it in the `Cookie` header of all mock API calls.
