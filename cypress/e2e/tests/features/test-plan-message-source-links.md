# Test Plan: Message Source Links & Resource Actions

**Feature Area**: `message-source-links`
**Date Created**: 2026-04-01
**Plan Type**: Incremental
**Spec File**: `cypress/e2e/tests/features/message-source-links.spec.ts`

## Source Components Analyzed

- `pkg/rancher-ai-ui/components/message/SourceLinks.vue`
- `pkg/rancher-ai-ui/components/message/action/index.vue`
- `pkg/rancher-ai-ui/components/message/action/Action.vue`
- `pkg/rancher-ai-ui/components/message/index.vue`
- `pkg/rancher-ai-ui/l10n/en-us.yaml`

## Existing Coverage

The following behaviors are already tested in `cypress/e2e/tests/features/message.spec.ts` and are **NOT duplicated** here:

- **"Show source links"** — Sends 3 `<mcp-doclink>` chunks, verifies each link label by index (`sourceLink(0)`, `sourceLink(1)`, `sourceLink(2)`) using the URL-path-derived label.
- **"Show list of resources"** — Uses `tool: { name: 'listKubernetesResources' }` to receive resource action buttons, verifies they exist and navigate to the deployment detail page on click.

The following behaviors are already tested in `cypress/e2e/tests/features/history/message.spec.ts`:

- Source links (`sourceLink(0)`, `sourceLink(1)`) and resource buttons in loaded history chats.

## Gaps This Plan Covers

1. Source links section is absent from DOM when response has no source link tags
2. Source links section collapses when the chevron icon is clicked
3. Source links section re-expands when the collapsed chevron is clicked again
4. Clicking a source link calls `window.open` with the correct URL
5. RelatedResourcesActions section shows the "RELATED RESOURCES" label (i18n key: `ai.message.relatedResourcesActions.label`)
6. When >7 resource actions are present, a "and N more resource(s)" link appears
7. Clicking "and N more resource(s)" reveals the remaining action buttons
8. Clicking "Show Less" collapses the remaining actions back

---

## Test Cases

### Test 1: Source links section is absent when response has no source link tags

**Description**: Verifies that the `.chat-source-container` element is not rendered when an AI message contains no `<mcp-doclink>` tags.

**Preconditions**:
- `cy.login()` completed
- `HomePagePo.goTo()` navigated
- Chat panel opened via `chat.open()`
- Welcome message (ID=1) received and completed

**Steps**:
1. Enqueue a plain text response with no source link tags.
2. Send a user message.
3. Wait for the AI response message (ID=3) to complete.
4. Assert `.chat-source-container` does not exist inside the message box.

**Assertions**:
- `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-source-container').should('not.exist')`

**Selectors**:
- `rancher-ai-ui-chat-message-box-3` (AI response, 3rd message after welcome)
- `.chat-source-container` (source links root div in `SourceLinks.vue`)

**Mock Data**:
```typescript
cy.enqueueLLMResponse({ text: 'Here is a plain response with no source links.' });
```

**Screenshot**: `message-source-links-test-1-no-source-links`

---

### Test 2: Source links section collapses when chevron is clicked

**Description**: Verifies that clicking the `.chat-msg-source-label` chevron icon toggles `isCollapsed` to `true`, hiding `.chat-msg-source-tags` and showing the down-chevron icon.

**Preconditions**:
- `cy.login()` completed
- `HomePagePo.goTo()` navigated
- Chat panel opened via `chat.open()`
- Welcome message (ID=1) received and completed

**Steps**:
1. Enqueue a response with two source link tags.
2. Send a user message.
3. Wait for the AI response message (ID=3) to complete.
4. Verify `.chat-msg-source-tags` is visible (not collapsed by default).
5. Verify the chevron shows `icon-chevron-up` (expanded state).
6. Click the `.chat-msg-source-label .icon` chevron.
7. Assert `.chat-msg-source-tags` is no longer in the DOM.
8. Assert the chevron shows `icon-chevron-down` (collapsed state).

**Assertions**:
- Before click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-source-tags').should('exist')`
- Before click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-source-label .icon-chevron-up').should('exist')`
- After click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-source-tags').should('not.exist')`
- After click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-source-label .icon-chevron-down').should('exist')`

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `.chat-msg-source-label` (clickable row in `SourceLinks.vue`)
- `.chat-msg-source-label .icon` (chevron icon, click target)
- `.chat-msg-source-tags` (v-if container for link tags)
- `.icon-chevron-up` / `.icon-chevron-down` (Rancher icon classes on the `<i>` element)

**Mock Data**:
```typescript
cy.enqueueLLMResponse({
  text: [
    'Here are some docs: ',
    '<mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink>',
    '<mcp-doclink>https://www.rancher.com/support/</mcp-doclink>',
  ],
});
```

**Screenshot**: `message-source-links-test-2-collapse-source-links`

---

### Test 3: Source links section re-expands after a second chevron click

**Description**: Verifies that clicking the collapsed chevron icon again sets `isCollapsed` back to `false`, restoring the `.chat-msg-source-tags` and showing the up-chevron.

**Preconditions**:
- Same as Test 2 — chat open, welcome message completed, response with source links received and source section currently **collapsed** (picking up from Test 2 state, or repeating the collapse step).

**Steps**:
1. Enqueue a response with two source link tags (same as Test 2).
2. Send a user message.
3. Wait for the AI response message (ID=3) to complete.
4. Click the `.chat-msg-source-label .icon` chevron to collapse.
5. Assert `.chat-msg-source-tags` is gone (confirming collapsed).
6. Click the chevron again to expand.
7. Assert `.chat-msg-source-tags` reappears.
8. Assert the chevron shows `icon-chevron-up`.

**Assertions**:
- After second click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-source-tags').should('exist')`
- After second click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-source-label .icon-chevron-up').should('exist')`

**Selectors**: Same as Test 2.

**Mock Data**: Same as Test 2.

**Screenshot**: `message-source-links-test-3-expand-source-links`

---

### Test 4: Clicking a source link opens the URL in a new tab

**Description**: Verifies that clicking a source link tag calls `window.open(url, '_blank')`. Since Cypress cannot open new browser tabs, `window.open` must be stubbed.

**Preconditions**:
- `cy.login()` completed
- `HomePagePo.goTo()` navigated
- Chat panel opened via `chat.open()`
- Welcome message (ID=1) received and completed

**Steps**:
1. Stub `window.open` before navigating: `cy.window().then((win) => cy.stub(win, 'open').as('windowOpen'))`.
2. Enqueue a response with one source link tag.
3. Send a user message.
4. Wait for the AI response message (ID=3) to complete.
5. Click on `cy.get('[data-testid="rancher-ai-ui-chat-message-source-link-0"]')`.
6. Assert the `@windowOpen` stub was called with the correct URL.

**Assertions**:
- `cy.get('@windowOpen').should('have.been.calledOnceWith', 'https://www.rancher.com/why-rancher', '_blank')`

**Selectors**:
- `rancher-ai-ui-chat-message-source-link-0`

**Mock Data**:
```typescript
cy.enqueueLLMResponse({
  text: [
    'Check out this link: ',
    '<mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink>',
  ],
});
```

**Implementation Notes**:
- Stub `window.open` **before** the page is navigated in `beforeEach`, not after.
- The `SourceLinks.vue` `openLink` method calls `window.open(url, '_blank')`, so the spy should be set up early.
- Use `cy.window().then(win => cy.stub(win, 'open').as('windowOpen'))` after `HomePagePo.goTo()` but before `chat.open()`.

**Screenshot**: `message-source-links-test-4-click-source-link`

---

### Test 5: RelatedResourcesActions shows "RELATED RESOURCES" label

**Description**: Verifies that the actions container for MCP-tool-fetched resources displays the "RELATED RESOURCES" label (`ai.message.relatedResourcesActions.label` → "RELATED RESOURCES").

**Preconditions**:
- `cy.login()` completed
- `HomePagePo.goTo()` navigated
- Chat panel opened via `chat.open()`
- Welcome message (ID=1) received and completed

**Steps**:
1. Enqueue a response that includes a `<mcp-response>` chunk with a single valid resource JSON.
2. Send a user message.
3. Wait for the AI response message (ID=3) to complete.
4. Assert `.chat-msg-action-title` contains text "RELATED RESOURCES".

**Assertions**:
- `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-action-title').should('contain.text', 'RELATED RESOURCES')`

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `.chat-actions-container` (wraps actions section in `action/index.vue`)
- `.chat-msg-action-title` (the label span)

**Mock Data**:
```typescript
cy.enqueueLLMResponse({
  text: [
    'Here is the resource: ',
    '<mcp-response>{"kind":"Pod","namespace":"default","name":"my-pod","cluster":"local","type":"pod"}</mcp-response>',
  ],
});
```

**Screenshot**: `message-source-links-test-5-related-resources-label`

---

### Test 6: "And N more resource(s)" button appears for >7 resource actions

**Description**: Verifies that when an AI message has more than 7 `relatedResourcesActions`, the `action/index.vue` renders a `.chat-msg-actions-more` span containing "and 1 more resource" (ICU plural for count=1).

**Preconditions**:
- `cy.login()` completed
- `HomePagePo.goTo()` navigated
- Chat panel opened via `chat.open()`
- Welcome message (ID=1) received and completed

**Steps**:
1. Enqueue a response with a `<mcp-response>` chunk containing an array of 8 resource objects (7 shown + 1 hidden).
2. Send a user message.
3. Wait for the AI response message (ID=3) to complete.
4. Assert that exactly 7 action buttons are visible.
5. Assert `.chat-msg-actions-more` is visible and contains text "and 1 more resource".

**Assertions**:
- `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('[data-testid^="rancher-ai-ui-chat-message-action-button-"]').should('have.length', 7)`
- `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-actions-more').should('be.visible').and('contain.text', 'and 1 more resource')`

**Selectors**:
- `rancher-ai-ui-chat-message-box-3`
- `[data-testid^="rancher-ai-ui-chat-message-action-button-"]` (prefix match for all action buttons)
- `.chat-msg-actions-more`

**Mock Data**:
```typescript
const resources = Array.from({ length: 8 }, (_, i) => ({
  kind:      'Pod',
  namespace: 'default',
  name:      `pod-${i + 1}`,
  cluster:   'local',
  type:      'pod',
}));

cy.enqueueLLMResponse({
  text: [
    'Here are the pods: ',
    `<mcp-response>${JSON.stringify(resources)}</mcp-response>`,
  ],
});
```

**Implementation Notes**:
- `THRESHOLD` in `action/index.vue` is `7` (hard-coded constant). 8 items → 7 shown + 1 in `remaining`.
- The i18n key `ai.message.actions.more` uses ICU plural: `=1 { and {count} more resource }` → "and 1 more resource".
- Each resource JSON object must include all required validator fields: `kind`, `namespace`, `name`, `cluster`, `type`.

**Screenshot**: `message-source-links-test-6-show-more-actions`

---

### Test 7: Clicking "And N more resource(s)" reveals all actions

**Description**: Verifies that clicking `.chat-msg-actions-more` when `showRemaining` is `false` toggles it to `true`, rendering all 8 action buttons.

**Preconditions**:
- Same as Test 6 — 8 resource actions in message, `.chat-msg-actions-more` visible.

**Steps**:
1. (Setup same as Test 6 — 8 resource actions in message.)
2. Assert `.chat-msg-actions-more` contains "and 1 more resource".
3. Click `.chat-msg-actions-more`.
4. Assert all 8 action buttons are now visible.
5. Assert `.chat-msg-actions-more` now contains "Show Less".

**Assertions**:
- After click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('[data-testid^="rancher-ai-ui-chat-message-action-button-"]').should('have.length', 8)`
- After click: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-actions-more').should('contain.text', 'Show Less')`

**Selectors**: Same as Test 6.

**Mock Data**: Same as Test 6.

**Screenshot**: `message-source-links-test-7-expand-remaining-actions`

---

### Test 8: Clicking "Show Less" collapses remaining actions

**Description**: Verifies that clicking `.chat-msg-actions-more` when `showRemaining` is `true` collapses back to the first 7 action buttons only.

**Preconditions**:
- Same as Test 7 — 8 resource actions, `showRemaining` currently `true` (all 8 visible, "Show Less" shown).

**Steps**:
1. (Setup same as Test 7 — expand remaining actions first.)
2. Assert all 8 buttons are visible.
3. Click `.chat-msg-actions-more` ("Show Less").
4. Assert only 7 action buttons are visible.
5. Assert `.chat-msg-actions-more` shows "and 1 more resource" again.

**Assertions**:
- After collapse: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('[data-testid^="rancher-ai-ui-chat-message-action-button-"]').should('have.length', 7)`
- After collapse: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').find('.chat-msg-actions-more').should('contain.text', 'and 1 more resource')`

**Selectors**: Same as Test 6.

**Mock Data**: Same as Test 6.

**Screenshot**: `message-source-links-test-8-collapse-remaining-actions`

---

## Page Objects Needed

### Existing POs to Reuse

| PO | Import | Usage |
|----|--------|-------|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | `open()`, `getMessage(id)`, `sendMessage(text)` |
| `MessagePo` (via `chat.getMessage(id)`) | `@/cypress/e2e/po/message.po` | `sourceLink(index)`, `resourceButton(name)`, `isCompleted()`, `containsText(text)` |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | `goTo()` |

### New POs Needed

None. All required selectors are accessible via the existing `MessagePo` `sourceLink(index)` method (for source link data-testid) and direct `cy.get`/`find` calls for CSS selectors (`.chat-source-container`, `.chat-msg-source-tags`, `.chat-msg-actions-more`, etc.) that are not yet in `MessagePo`.

---

## Custom Commands

| Command | Usage |
|---------|-------|
| `cy.login()` | `beforeEach` setup |
| `cy.enqueueLLMResponse({ text })` | Queue mock AI responses before `chat.sendMessage()` |
| `cy.cleanChatHistory()` | `afterEach` or `after` cleanup |
| `cy.clearLLMResponses()` | `beforeEach` cleanup |

---

## Mock Data

### Source Link Tag Format
```typescript
// Single source link chunk:
'<mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink>'

// Multiple source link chunks (each in its own array element):
text: [
  'Intro text.',
  '<mcp-doclink>https://www.rancher.com/why-rancher</mcp-doclink>',
  '<mcp-doclink>https://www.rancher.com/support/</mcp-doclink>',
]
```

**Note**: Each `<mcp-doclink>` chunk must be a **separate array element** so that each chunk starts with `Tag.DocLinkStart` and ends with `Tag.DocLinkEnd`. The composable checks `data.startsWith(Tag.DocLinkStart) && data.endsWith(Tag.DocLinkEnd)`.

### RelatedResourcesActions Tag Format
```typescript
// Single resource:
'<mcp-response>{"kind":"Pod","namespace":"default","name":"my-pod","cluster":"local","type":"pod"}</mcp-response>'

// Array of 8 resources for >THRESHOLD test:
const resources = Array.from({ length: 8 }, (_, i) => ({
  kind:      'Pod',
  namespace: 'default',
  name:      `pod-${i + 1}`,
  cluster:   'local',
  type:      'pod',
}));
`<mcp-response>${JSON.stringify(resources)}</mcp-response>`
```

**Note**: Each resource object must pass `validateActionResource` which requires all of: `kind`, `namespace`, `name`, `cluster`, `type`. The `<mcp-response>` chunk must be a single array element so it starts with `Tag.McpResultStart` and ends with `Tag.McpResultEnd`.

### Mock API
- **Endpoint**: `POST ${Cypress.env('llmMockServiceProxyPath')}/v1/control/push`
- **Method**: `POST` (NOT `PUT`)
- **Used via**: `cy.enqueueLLMResponse()` custom command

---

## Message ID Reference

For all tests with a fresh chat (after `cy.cleanChatHistory()` + `chat.open()`):
- **Message ID 1**: AI welcome message (sent automatically when chat initializes)
- **Message ID 2**: User message (after `chat.sendMessage(...)`)
- **Message ID 3**: AI response message (after mock processes the request)

---

## Spec File Location

```
cypress/e2e/tests/features/message-source-links.spec.ts
```

---

## Implementation Notes

### Chevron Icon Selectors
`SourceLinks.vue` uses `:class` binding on the `<i>` element:
```html
<i
  class="icon icon-sm"
  :class="{
    'icon icon-chevron-up text-label': !isCollapsed,
    'icon icon-chevron-down text-label': isCollapsed
  }"
  @click="isCollapsed = !isCollapsed"
/>
```
- When **not collapsed**: element has classes `icon icon-sm icon icon-chevron-up text-label`
- When **collapsed**: element has classes `icon icon-sm icon icon-chevron-down text-label`
- **Click target**: `.chat-msg-source-label .icon` (the `<i>` element within the label row)

### window.open Stub Setup
The stub must be set up on the `window` object **before** navigating/interacting:
```typescript
cy.window().then((win) => {
  cy.stub(win, 'open').as('windowOpen');
});
```
Set up this stub **after** `HomePagePo.goTo()` but before `chat.open()` and `chat.sendMessage()`.

### action/index.vue THRESHOLD Constant
The `THRESHOLD` constant in `components/message/action/index.vue` is `7`. Items 0–6 (first 7) are always shown; items 7+ go into `remaining`. The "more/less" toggle only appears when `remaining.length > 0`.
