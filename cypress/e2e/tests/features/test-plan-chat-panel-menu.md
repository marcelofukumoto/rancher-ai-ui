# Test Plan: Chat Panel Menu

**Feature Area:** `chat-panel-menu`
**Date Created:** 2026-03-31
**Spec File:** `cypress/e2e/tests/features/chat-panel-menu.spec.ts`

## Source Components Analyzed

- `pkg/rancher-ai-ui/components/header/ChatPanelMenu.vue` — dropdown menu with Download, Shortcuts, Config actions
- `pkg/rancher-ai-ui/components/panels/Header.vue` — wraps ChatPanelMenu; emits events up to Chat.vue
- `pkg/rancher-ai-ui/components/header/KeyboardShortcuts.vue` — shortcuts overlay triggered via menu
- `pkg/rancher-ai-ui/components/popover/TextLabel.vue` — underlying popper used by KeyboardShortcuts
- `pkg/rancher-ai-ui/pages/Chat.vue` — handles emitted events: `downloadMessages`, `openShortcuts`, `routeToSettings`
- `pkg/rancher-ai-ui/composables/useChatMessageComposable.ts` — `downloadMessages` creates and downloads a `.txt` file

## Available Selectors

### data-testid (verified in source)

| Selector | Component | Notes |
|---|---|---|
| `rancher-ai-ui-chat-container` | `pages/Chat.vue` | Root chat panel element |
| `rancher-ai-ui-chat-panel-ready` | `pages/Chat.vue` | Indicates WS connected and initialized |
| `rancher-ai-ui-chat-close-button` | `components/panels/Header.vue` | Close button in header |
| `rancher-ai-ui-chat-history-button` | `components/panels/Header.vue` | History toggle button |

### CSS Class Selectors (no data-testid available)

| Selector | Component | Notes |
|---|---|---|
| `.chat-console-menu-container` | `ChatPanelMenu.vue` | Wrapper div for the ⋮ menu |
| `.chat-console-menu-container button` | `ChatPanelMenu.vue` | The `rc-dropdown-trigger` renders a `<button>` |
| `.shortcuts` | `KeyboardShortcuts.vue` | Content wrapper inside shortcuts popover |
| `.shortcuts-title` | `KeyboardShortcuts.vue` | "Keyboard Shortcuts" heading text |
| `.shortcuts-row` | `KeyboardShortcuts.vue` | Individual shortcut rows |
| `.shortcuts-action` | `KeyboardShortcuts.vue` | Action label text per shortcut |
| `.shortcuts-key` | `KeyboardShortcuts.vue` | Key combination display element |
| `.v-popper__inner` | floating-ui / VPopper | Popover content container (visible when open) |

### Content-Based Selectors (cy.contains)

The three menu options are rendered as `rc-dropdown-item` children with i18n labels:

| Label Text | i18n Key | Action |
|---|---|---|
| `Download Messages` | `ai.menu.options.chat.download.label` | Triggers file download |
| `View Keyboard Shortcuts` | `ai.menu.options.chat.shortcuts.label` | Opens shortcuts overlay |
| `Edit Configuration` | `ai.menu.options.chat.config.label` | Navigates to settings |

## Test Cases

---

### Test 1: Menu button is visible in the chat header

**Description:** When the chat panel is open and initialized, the ⋮ menu button is rendered in the header area.

**Preconditions:**
- User is logged in
- Chat panel is open (`chat.open()`, `chat.isReady()`)

**Steps:**
1. Open the chat panel

**Assertions:**
- `.chat-console-menu-container` is visible within `[data-testid="rancher-ai-ui-chat-container"]`
- `.chat-console-menu-container button` is visible and not disabled

**Selectors:**
- `[data-testid="rancher-ai-ui-chat-container"]`
- `.chat-console-menu-container`
- `.chat-console-menu-container button`

**Screenshot:** `chat-panel-menu-test-1-menu-button-visible`

---

### Test 2: Clicking the menu button opens the dropdown

**Description:** Clicking the ⋮ button opens a dropdown menu. No option is pre-selected. The dropdown is visible.

**Preconditions:**
- User is logged in
- Chat panel is open and ready

**Steps:**
1. Open chat panel
2. Click `.chat-console-menu-container button`

**Assertions:**
- The dropdown becomes visible (`.v-popper__inner` is visible, or the popover container appears)
- At least one dropdown item with text "Download Messages" is visible

**Selectors:**
- `.chat-console-menu-container button`
- `.v-popper__inner`

**Screenshot:** `chat-panel-menu-test-2-dropdown-open`

---

### Test 3: Dropdown shows all three expected options

**Description:** The open dropdown contains exactly the three expected menu items.

**Preconditions:**
- User is logged in
- Chat panel is open and ready
- ⋮ menu dropdown is open (from Test 2 steps)

**Steps:**
1. Open chat panel
2. Click `.chat-console-menu-container button`

**Assertions:**
- `cy.contains('Download Messages')` is visible
- `cy.contains('View Keyboard Shortcuts')` is visible
- `cy.contains('Edit Configuration')` is visible

**Selectors:**
- `.chat-console-menu-container button`
- `cy.contains('Download Messages')`
- `cy.contains('View Keyboard Shortcuts')`
- `cy.contains('Edit Configuration')`

**Screenshot:** `chat-panel-menu-test-3-all-options-visible`

---

### Test 4: "Download Messages" triggers a file download

**Description:** Clicking "Download Messages" invokes the file download mechanism. The browser creates a Blob URL and triggers the download. The chat panel remains open after this action.

**Preconditions:**
- User is logged in
- Chat panel is open and ready
- At least one message has been sent and received (so there is content to download)
  - Message sequence: send one user message → AI response (IDs 1 and 2 respectively after welcome message)
  - Enqueue LLM response before sending the user message

**Steps:**
1. Open chat panel, wait for ready
2. Enqueue a mock AI response: `cy.enqueueLLMResponse({ text: 'Hello from AI.' })`
3. Send a message via `chat.sendMessage('Hello')`
4. Wait for AI response: `cy.get('[data-testid="rancher-ai-ui-chat-message-box-3"]').should('exist')`
   - (Message sequence: welcome message ID=1, user message ID=2, AI response ID=3)
5. Stub `window.URL.createObjectURL`:
   ```typescript
   cy.window().then((win) => {
     cy.stub(win.URL, 'createObjectURL').as('createObjectURL');
   });
   ```
6. Click `.chat-console-menu-container button`
7. Click `cy.contains('Download Messages')`

**Assertions:**
- `cy.get('@createObjectURL')` should have been called at least once
- `[data-testid="rancher-ai-ui-chat-container"]` is still visible (panel did not close)

**Selectors:**
- `.chat-console-menu-container button`
- `cy.contains('Download Messages')`
- `[data-testid="rancher-ai-ui-chat-container"]`
- `[data-testid="rancher-ai-ui-chat-message-box-3"]`

**Mock Data:**
```typescript
cy.enqueueLLMResponse({ text: 'Hello from AI.' });
```

**Screenshot:** `chat-panel-menu-test-4-download-triggered`

**Implementation Notes:**
- Message ID sequence after `cleanChatHistory()`: welcome=1, user=2, AI=3
- The stub must be set up before clicking the menu option
- `downloadFile` from `@shell/utils/download` creates a `<a download>` element, triggers `.click()`, and revokes the URL — `createObjectURL` is the key interception point

---

### Test 5: "View Keyboard Shortcuts" opens the shortcuts overlay

**Description:** Clicking "View Keyboard Shortcuts" triggers the `shortcuts:chat` event, which calls `openShortcuts()` in Chat.vue. This opens the `KeyboardShortcuts` popover, displaying the shortcuts content.

**Preconditions:**
- User is logged in
- Chat panel is open and ready

**Steps:**
1. Open chat panel
2. Click `.chat-console-menu-container button`
3. Click `cy.contains('View Keyboard Shortcuts')`

**Assertions:**
- `.shortcuts-title` is visible with text "Keyboard Shortcuts"
- `.shortcuts` container is visible
- At least one `.shortcuts-row` is present

**Selectors:**
- `.chat-console-menu-container button`
- `cy.contains('View Keyboard Shortcuts')`
- `.shortcuts-title`
- `.shortcuts`
- `.shortcuts-row`

**Screenshot:** `chat-panel-menu-test-5-shortcuts-overlay-open`

---

### Test 6: Shortcuts overlay displays all expected keyboard shortcut entries

**Description:** The open keyboard shortcuts popover shows all 6 expected shortcut entries with their action descriptions.

**Preconditions:**
- Same as Test 5
- Keyboard shortcuts overlay is open

**Steps:**
1. Open chat panel
2. Click `.chat-console-menu-container button`
3. Click `cy.contains('View Keyboard Shortcuts')`

**Assertions:**
- `.shortcuts-row` count is at least 6
- `cy.contains('.shortcuts-action', 'Open / Close Chat Panel')` exists
- `cy.contains('.shortcuts-action', 'New Chat')` exists
- `cy.contains('.shortcuts-action', 'Copy Last Response')` exists
- `cy.contains('.shortcuts-action', 'View Previous Chats')` exists
- `cy.contains('.shortcuts-action', 'Delete Current Chat')` exists
- `cy.contains('.shortcuts-action', 'Previous / Next Prompt')` exists
- At least one `.shortcuts-key` element is visible

**Selectors:**
- `.shortcuts-row`
- `.shortcuts-action`
- `.shortcuts-key`

**Screenshot:** `chat-panel-menu-test-6-shortcuts-all-entries`

---

### Test 7: "Edit Configuration" navigates to the settings page

**Description:** Clicking "Edit Configuration" calls `routeToSettings()` in Chat.vue, which pushes the `c-cluster-settings-rancher-ai-ui` route. The settings page becomes visible.

**Preconditions:**
- User is logged in
- Browser is on a non-settings page (e.g., Home page)
- Chat panel is open and ready

**Steps:**
1. Navigate to Home page (`HomePagePo.goTo()`)
2. Open chat panel
3. Click `.chat-console-menu-container button`
4. Click `cy.contains('Edit Configuration')`

**Assertions:**
- `cy.url()` contains `settings` within a reasonable timeout
- `cy.contains('AI Assistant Configuration')` is visible on the page

**Selectors:**
- `.chat-console-menu-container button`
- `cy.contains('Edit Configuration')`
- `cy.url()`

**Screenshot:** `chat-panel-menu-test-7-navigate-to-settings`

---

### Test 8: Dropdown closes after selecting an option

**Description:** After clicking any dropdown option, the dropdown is dismissed and its content is no longer visible.

**Preconditions:**
- User is logged in
- Chat panel is open and ready

**Steps:**
1. Open chat panel
2. Click `.chat-console-menu-container button` to open dropdown
3. Verify dropdown is open (`cy.contains('View Keyboard Shortcuts').should('be.visible')`)
4. Click `cy.contains('View Keyboard Shortcuts')`

**Assertions:**
- After clicking, `cy.contains('Download Messages').should('not.exist')` (dropdown is closed)

**Selectors:**
- `.chat-console-menu-container button`
- `cy.contains('View Keyboard Shortcuts')`
- `cy.contains('Download Messages')`

**Screenshot:** `chat-panel-menu-test-8-dropdown-closes-after-action`

---

### Test 9: Dropdown closes when clicking outside

**Description:** Clicking outside the open dropdown (but still within the chat container) dismisses the dropdown without selecting any option.

**Preconditions:**
- User is logged in
- Chat panel is open and ready
- Dropdown is open

**Steps:**
1. Open chat panel
2. Click `.chat-console-menu-container button` to open dropdown
3. Verify dropdown is visible: `cy.contains('Download Messages').should('be.visible')`
4. Click on the chat container header area outside the menu: `cy.get('[data-testid="rancher-ai-ui-chat-close-button"]').trigger('click', { force: true })`
   - **Note:** Use the close button area as an outside-click target only; after this, verify dropdown is gone before checking if panel closed
   - Alternatively, click on `.chat-messages` area: `cy.get('[data-testid="rancher-ai-ui-chat-container"]').click(10, 200)`

**Assertions:**
- `cy.contains('Download Messages').should('not.exist')` — dropdown is dismissed

**Selectors:**
- `.chat-console-menu-container button`
- `cy.contains('Download Messages')`
- `[data-testid="rancher-ai-ui-chat-container"]`

**Screenshot:** `chat-panel-menu-test-9-dropdown-closes-on-outside-click`

**Implementation Notes:**
- Use `cy.get('[data-testid="rancher-ai-ui-chat-container"]').click(10, 200)` to click the messages area (avoiding the header) to dismiss the dropdown without navigating away
- If the close button triggers panel close, use a different target such as `.chat-messages` or a message area

---

## Page Objects Needed

### New Page Object: `ChatPanelMenuPo`

**File:** `cypress/e2e/po/chat-panel-menu.po.ts`

```typescript
import ComponentPo from '@rancher/cypress/e2e/po/components/component.po';

export class ChatPanelMenuPo extends ComponentPo {
  constructor() {
    super('.chat-console-menu-container');
  }

  menuButton() {
    return this.self().find('button');
  }

  open() {
    this.menuButton().click();
    return this;
  }

  downloadOption() {
    return cy.contains('Download Messages');
  }

  shortcutsOption() {
    return cy.contains('View Keyboard Shortcuts');
  }

  configOption() {
    return cy.contains('Edit Configuration');
  }

  isDropdownOpen() {
    return cy.contains('Download Messages').should('be.visible');
  }

  isDropdownClosed() {
    return cy.contains('Download Messages').should('not.exist');
  }
}
```

### Existing Page Objects to Reuse

| Page Object | Import Path | Usage |
|---|---|---|
| `ChatPo` | `@/cypress/e2e/po/chat.po` | `open()`, `isReady()`, `sendMessage()`, `getMessage()` |
| `HomePagePo` | `@rancher/cypress/e2e/po/pages/home.po` | Navigate to home page for Test 7 |

---

## Custom Commands

### Existing Commands to Use

| Command | Usage |
|---|---|
| `cy.login()` | Authentication in `beforeEach` |
| `cy.enqueueLLMResponse({ text })` | Mock AI response in Test 4 |
| `cy.cleanChatHistory()` | Reset chat state in `afterEach` |

### New Commands

No new custom commands are needed.

---

## Mock Data

### Test 4 — LLM Response for Download Test

```typescript
cy.enqueueLLMResponse({ text: 'Hello from AI.' });
```

All other tests do not require LLM responses as they only interact with the menu UI.

---

## Spec File Location

**Path:** `cypress/e2e/tests/features/chat-panel-menu.spec.ts`

### Suggested Spec Skeleton

```typescript
import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';
import ChatPo from '@/cypress/e2e/po/chat.po';
import { ChatPanelMenuPo } from '@/cypress/e2e/po/chat-panel-menu.po';

describe('Chat Panel Menu', () => {
  const chat = new ChatPo();
  const menu = new ChatPanelMenuPo();

  before(() => cy.login());

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
    chat.open();
    chat.isReady();
  });

  afterEach(() => cy.cleanChatHistory());

  it('Test 1: Menu button is visible in chat header', () => { ... });
  it('Test 2: Clicking menu button opens the dropdown', () => { ... });
  it('Test 3: Dropdown shows all three expected options', () => { ... });
  it('Test 4: Download Messages triggers file download', () => { ... });
  it('Test 5: View Keyboard Shortcuts opens shortcuts overlay', () => { ... });
  it('Test 6: Shortcuts overlay displays all expected entries', () => { ... });
  it('Test 7: Edit Configuration navigates to settings page', () => { ... });
  it('Test 8: Dropdown closes after selecting an option', () => { ... });
  it('Test 9: Dropdown closes when clicking outside', () => { ... });
});
```

---

## Anti-Patterns to Avoid

- **Do NOT** assert `.chat-console-menu-container button` has `data-testid="rancher-ai-ui-chat-menu-button"` — this attribute does not exist in the source code; the quick reference is misleading
- **Do NOT** assert `disabled` on the menu trigger during any chat phase — `Header.vue` never passes the `disabled` prop to `ChatPanelMenu`, so the menu is always enabled regardless of chat state
- **Do NOT** use `.v-popper__inner` as the sole assertion for shortcuts overlay open state — prefer `.shortcuts-title` or `.shortcuts` which are component-specific
- **Do NOT** try to interact with `.rc-dropdown-item` directly — use `cy.contains()` with the option's visible label text
- **IMPORTANT for Test 4:** Set up `URL.createObjectURL` stub BEFORE opening the menu. The stub must be in place before the click event triggers the download.
- **IMPORTANT for Test 7:** After navigating to settings, the `beforeEach` of the next test will call `HomePagePo.goTo()` to reset navigation, preventing test bleed-over.
