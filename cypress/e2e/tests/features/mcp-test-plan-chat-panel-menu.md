# MCP Test Plan: Chat Panel Menu

- **Feature Area**: `chat-panel-menu`
- **Date Created**: 2026-04-01
- **Execution Method**: **MCP Playwright** (AI agent with Playwright browser automation — no Cypress spec file)
- **Source Components Analyzed**:
  - `pkg/rancher-ai-ui/components/header/ChatPanelMenu.vue`
  - `pkg/rancher-ai-ui/components/header/KeyboardShortcuts.vue`
  - `pkg/rancher-ai-ui/components/panels/Header.vue`
  - `pkg/rancher-ai-ui/components/popover/TextLabel.vue`
  - `pkg/rancher-ai-ui/pages/Chat.vue`
  - `pkg/rancher-ai-ui/composables/useKeyboardShortcutsComposable.ts`
  - `pkg/rancher-ai-ui/l10n/en-us.yaml`

---

## Prerequisites

- **Application URL**: `https://localhost:8005`
- **Login credentials**: username `admin`, password from `CATTLE_BOOTSTRAP_PASSWORD` (default: `admin`)
- **Self-signed certificate**: Configure Playwright to ignore HTTPS errors (`ignoreHTTPSErrors: true`)
- **LLM mock service**: accessible via Rancher reverse proxy at
  `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy`
- **Session cookie**: The `R_SESS` cookie obtained after login must be included in mock service API calls
- **Headless Chromium**: All tests run in headless Chromium inside Docker

### Standard Login Steps (apply before every test)

1. Navigate to `https://localhost:8005` (ignore certificate errors)
2. Wait for the login page to load (look for a password field)
3. Fill in username `admin` and password (from `CATTLE_BOOTSTRAP_PASSWORD`)
4. Click the "Log In" button
5. Wait for the Rancher Dashboard home page to appear
6. Open the chat panel by pressing `Alt+K` (Linux) or `Cmd+Shift+K` (macOS)
7. Wait for the element `[data-testid="rancher-ai-ui-chat-panel-ready"]` to be visible (up to 30 seconds)
8. Take a screenshot named `chat-panel-menu-mcp-setup`

---

## Selectors Reference

| Selector | Element | Source |
|----------|---------|--------|
| `[data-testid="rancher-ai-ui-chat-panel-ready"]` | Chat panel loaded indicator | `pages/Chat.vue` |
| `[data-testid="rancher-ai-ui-chat-container"]` | Chat panel root | `pages/Chat.vue` |
| `[data-testid="rancher-ai-ui-chat-close-button"]` | Close chat button | `components/panels/Header.vue` |
| `.chat-console-menu-container` | Menu trigger wrapper div | `components/header/ChatPanelMenu.vue` |
| `.chat-console-menu-container button` | The ⋮ menu trigger button | `components/header/ChatPanelMenu.vue` |
| `.shortcuts` | Keyboard shortcuts overlay content wrapper | `components/header/KeyboardShortcuts.vue` |
| `.shortcuts-title` | Shortcuts overlay title span | `components/header/KeyboardShortcuts.vue` |
| `.shortcuts-row` | Each shortcut row entry | `components/header/KeyboardShortcuts.vue` |
| `.shortcuts-action` | Action label text in a shortcut row | `components/header/KeyboardShortcuts.vue` |
| `.shortcuts-key` | Key binding `<kbd>` element in a row | `components/header/KeyboardShortcuts.vue` |

> **NOTE**: `rancher-ai-ui-chat-menu-button` (listed in some references) does **NOT** exist in source.
> Always use `.chat-console-menu-container button` as the menu trigger selector.

---

## Mock Data Setup

Some tests require a prior AI response to have content to download or interact with. Use the following HTTP request structure to enqueue mock LLM responses before sending a message.

**Enqueue mock response:**

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
Content-Type: application/json
Cookie: R_SESS=<session-token>

{
  "text": {
    "chunks": ["This is a mock AI response for the chat-panel-menu test."]
  }
}
```

**Clear mock queue (before each test that uses the mock):**

```
POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear
Content-Type: application/json
Cookie: R_SESS=<session-token>
```

---

## Test Cases

---

### Test 1: Open the chat panel menu via the ⋮ button

**Description**: Verifies that clicking the menu trigger button (three-dots icon in the chat header)
opens a dropdown with exactly three menu options.

**Preconditions**: Chat panel is open and ready (panel-ready indicator visible). No prior interaction needed.

**Steps**:
1. Perform the Standard Login Steps above.
2. Locate the menu trigger button using selector `.chat-console-menu-container button`.
3. Verify the button is visible in the chat header area.
4. Click the menu trigger button (`.chat-console-menu-container button`).
5. Wait 500ms for the dropdown animation to complete.
6. Take a screenshot named `chat-panel-menu-mcp-test-1-menu-open`.

**Assertions**:
- The element `.chat-console-menu-container button` is visible before clicking
- After clicking, a dropdown list appears containing three visible menu items
- The first item text is "Download Messages"
- The second item text is "View Keyboard Shortcuts"
- The third item text is "Edit Configuration"

**Selectors**:
- `.chat-console-menu-container button` — menu trigger
- Dropdown items containing text "Download Messages", "View Keyboard Shortcuts", "Edit Configuration"

**Screenshot**: `chat-panel-menu-mcp-test-1-menu-open`

---

### Test 2: Menu is always enabled regardless of chat state

**Description**: Verifies that the chat panel menu button remains enabled and clickable at all times,
because `Header.vue` does **not** pass a `disabled` prop to `ChatPanelMenu`. This is by design.

**Preconditions**: Chat panel is open and ready.

**Steps**:
1. Perform the Standard Login Steps above.
2. Locate the menu trigger button using selector `.chat-console-menu-container button`.
3. Verify the button does not have a `disabled` attribute.
4. Click the button to open the menu.
5. Verify the dropdown appears with items visible.
6. Press `Escape` or click outside (`[data-testid="rancher-ai-ui-chat-container"]` at coordinates (10, 200)) to close the menu.
7. Take a screenshot named `chat-panel-menu-mcp-test-2-always-enabled`.

**Assertions**:
- `.chat-console-menu-container button` does not have a `disabled` HTML attribute
- Menu opens and shows the three options even when no message has been sent
- Menu closes cleanly after pressing Escape or clicking outside

**Selectors**:
- `.chat-console-menu-container button`
- `[data-testid="rancher-ai-ui-chat-container"]`

**Screenshot**: `chat-panel-menu-mcp-test-2-always-enabled`

---

### Test 3: Dismiss menu by clicking outside the dropdown

**Description**: Verifies that clicking anywhere outside the dropdown menu closes it without
triggering any navigation or action.

**Preconditions**: Chat panel is open and ready.

**Steps**:
1. Perform the Standard Login Steps above.
2. Click the menu trigger button (`.chat-console-menu-container button`) to open the dropdown.
3. Wait 500ms for the dropdown to appear and verify it is visible (check for text "Download Messages").
4. Click on the chat container area at coordinates (10, 200) using selector
   `[data-testid="rancher-ai-ui-chat-container"]`. Do **not** use the close button
   (`[data-testid="rancher-ai-ui-chat-close-button"]`), as that will close the entire chat panel.
5. Wait 500ms for the dropdown to close.
6. Take a screenshot named `chat-panel-menu-mcp-test-3-menu-dismissed`.

**Assertions**:
- After clicking outside, the dropdown no longer shows the text "Download Messages"
- The chat panel is still open (`[data-testid="rancher-ai-ui-chat-panel-ready"]` is still visible)
- No navigation occurred (user is still on the Rancher Dashboard)

**Selectors**:
- `.chat-console-menu-container button`
- `[data-testid="rancher-ai-ui-chat-container"]` (click at coordinates 10, 200)
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Screenshot**: `chat-panel-menu-mcp-test-3-menu-dismissed`

---

### Test 4: Download Messages option triggers a file download

**Description**: Verifies that clicking "Download Messages" in the chat panel menu triggers a browser
file download. The test stubs `window.URL.createObjectURL` before interacting to intercept the
download and confirm the action was triggered.

**Preconditions**: Chat panel is open and ready. A mock AI response must be enqueued and a message
sent so there is content to download.

**Mock Setup (before test)**:

1. Clear the mock queue via:
   ```
   POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/clear
   Cookie: R_SESS=<session-token>
   ```
2. Enqueue a single-chunk mock response:
   ```
   POST https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy/v1/control/push
   Content-Type: application/json
   Cookie: R_SESS=<session-token>

   { "text": { "chunks": ["Hello! This is a test response for download."] } }
   ```

**Steps**:
1. Perform the Standard Login Steps above.
2. Intercept / stub `window.URL.createObjectURL` at the browser level to capture calls
   (in Playwright: evaluate a script that replaces `window.URL.createObjectURL` with a spy function
   that records calls and returns `"blob:stub"`).
3. Click the textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` and type
   `"Download test message"`.
4. Press `Enter` to send the message.
5. Wait up to 15 seconds for the AI response to appear in the message list
   (`[data-testid="rancher-ai-ui-chat-message-box-2"]` to be visible, as message 1 is the
   AI welcome message and message 2 is the AI reply).
6. Click the menu trigger button (`.chat-console-menu-container button`).
7. Wait 500ms for the dropdown to appear.
8. Click the "Download Messages" menu item.
9. Wait 1 second.
10. Take a screenshot named `chat-panel-menu-mcp-test-4-download-triggered`.

**Assertions**:
- `window.URL.createObjectURL` was called at least once (confirming a Blob was created for download)
- The dropdown closes after clicking the option
- The chat panel remains open after the download action

**Selectors**:
- `.chat-console-menu-container button`
- `[data-testid="rancher-ai-ui-chat-input-textarea"]`
- `[data-testid="rancher-ai-ui-chat-message-box-2"]`

**Screenshot**: `chat-panel-menu-mcp-test-4-download-triggered`

---

### Test 5: View Keyboard Shortcuts opens the shortcuts overlay

**Description**: Verifies that clicking "View Keyboard Shortcuts" in the chat panel menu opens
the keyboard shortcuts overlay panel (rendered by `KeyboardShortcuts.vue` via a `TextLabelPopover`).

**Preconditions**: Chat panel is open and ready. No prior message interaction needed.

**Steps**:
1. Perform the Standard Login Steps above.
2. Click the menu trigger button (`.chat-console-menu-container button`).
3. Wait 500ms for the dropdown to appear and confirm "View Keyboard Shortcuts" is visible.
4. Click the "View Keyboard Shortcuts" menu item.
5. Wait 1 second for the shortcuts overlay animation to complete.
6. Take a screenshot named `chat-panel-menu-mcp-test-5-shortcuts-open`.

**Assertions**:
- The element `.shortcuts` is visible after clicking "View Keyboard Shortcuts"
- The element `.shortcuts-title` is visible and contains the text "Keyboard Shortcuts"
- At least one `.shortcuts-row` element is visible

**Selectors**:
- `.chat-console-menu-container button`
- `.shortcuts`
- `.shortcuts-title`
- `.shortcuts-row`

**Screenshot**: `chat-panel-menu-mcp-test-5-shortcuts-open`

---

### Test 6: Keyboard shortcuts overlay shows all 6 shortcut entries (Linux)

**Description**: Verifies that the keyboard shortcuts overlay displays exactly 6 shortcut rows,
each with the correct action label, matching the 6 entries defined in `KeyboardShortcuts.vue`
(using Linux/Windows key bindings since the test runs on Linux).

**Preconditions**: Chat panel is open and ready; shortcuts overlay is open (follow steps from Test 5).

**Steps**:
1. Perform the Standard Login Steps above.
2. Click the menu trigger button (`.chat-console-menu-container button`).
3. Click the "View Keyboard Shortcuts" menu item.
4. Wait 1 second for the overlay to appear.
5. Count the number of `.shortcuts-row` elements visible.
6. For each row, read the text content of `.shortcuts-action` inside that row.
7. Take a screenshot named `chat-panel-menu-mcp-test-6-shortcuts-rows`.

**Assertions**:
- There are exactly **6** `.shortcuts-row` elements visible
- Row 1 `.shortcuts-action` text is "Previous / Next Prompt"
- Row 2 `.shortcuts-action` text is "Open / Close Chat Panel"
- Row 3 `.shortcuts-action` text is "New Chat"
- Row 4 `.shortcuts-action` text is "Copy Last Response"
- Row 5 `.shortcuts-action` text is "View Previous Chats"
- Row 6 `.shortcuts-action` text is "Delete Current Chat"
- Each row also contains a `.shortcuts-key` `<kbd>` element with the key binding text

**Expected Linux key bindings (in `.shortcuts-key`)**:

| Action | Linux Key |
|--------|-----------|
| Previous / Next Prompt | ↑ ↓ |
| Open / Close Chat Panel | Alt K |
| New Chat | Ctrl Shift O |
| Copy Last Response | Ctrl Shift C |
| View Previous Chats | Ctrl Shift S |
| Delete Current Chat | Ctrl Shift ⌫ |

**Selectors**:
- `.shortcuts-row` (expect 6 total)
- `.shortcuts-action` (inside each row)
- `.shortcuts-key` (inside each row)

**Screenshot**: `chat-panel-menu-mcp-test-6-shortcuts-rows`

---

### Test 7: Keyboard shortcuts overlay dismissed by clicking outside

**Description**: Verifies that clicking outside the shortcuts overlay (on the chat container area)
closes the overlay without closing the chat panel itself.

**Preconditions**: Chat panel is open and ready; shortcuts overlay is open (follow steps from Test 5).

**Steps**:
1. Perform the Standard Login Steps above.
2. Click the menu trigger button (`.chat-console-menu-container button`).
3. Click the "View Keyboard Shortcuts" menu item.
4. Wait 1 second and verify `.shortcuts` is visible.
5. Click on the chat container area using `[data-testid="rancher-ai-ui-chat-container"]`
   at coordinates (10, 200). Do **not** use the close button.
6. Wait 500ms for the overlay to close.
7. Take a screenshot named `chat-panel-menu-mcp-test-7-shortcuts-dismissed`.

**Assertions**:
- After clicking outside, `.shortcuts` is no longer visible (or is not in the DOM)
- The chat panel is still open (`[data-testid="rancher-ai-ui-chat-panel-ready"]` is still visible)
- The chat input textarea `[data-testid="rancher-ai-ui-chat-input-textarea"]` is still accessible

**Selectors**:
- `.chat-console-menu-container button`
- `.shortcuts`
- `[data-testid="rancher-ai-ui-chat-container"]` (click at 10, 200)
- `[data-testid="rancher-ai-ui-chat-panel-ready"]`

**Screenshot**: `chat-panel-menu-mcp-test-7-shortcuts-dismissed`

---

### Test 8: Edit Configuration navigates to the settings page

**Description**: Verifies that clicking "Edit Configuration" in the chat panel menu navigates
the user to the Rancher AI UI settings page. The `Chat.vue` handler calls `routeToSettings()`
which pushes a route named `c-cluster-settings-rancher-ai-ui`.

**Preconditions**: Chat panel is open and ready.

**Steps**:
1. Perform the Standard Login Steps above.
2. Take note of the current URL.
3. Click the menu trigger button (`.chat-console-menu-container button`).
4. Wait 500ms for the dropdown to appear and confirm "Edit Configuration" is visible.
5. Click the "Edit Configuration" menu item.
6. Wait up to 5 seconds for navigation to complete.
7. Take a screenshot named `chat-panel-menu-mcp-test-8-edit-config-navigate`.

**Assertions**:
- After clicking "Edit Configuration", the browser URL changes (contains "settings" or "rancher-ai-ui")
- The settings page content is visible (some form or configuration UI is rendered)
- The user is no longer on the Rancher Dashboard home page

**Selectors**:
- `.chat-console-menu-container button`
- URL assertion: `page.url()` should contain `settings`

**Screenshot**: `chat-panel-menu-mcp-test-8-edit-config-navigate`

---

### Test 9: Menu dropdown closes after selecting an option

**Description**: Verifies that after selecting any menu option, the dropdown closes automatically.
This tests the `rc-dropdown` component's built-in close-on-select behavior.

**Preconditions**: Chat panel is open and ready.

**Steps**:
1. Perform the Standard Login Steps above.
2. Click the menu trigger button (`.chat-console-menu-container button`).
3. Wait 500ms for the dropdown to appear.
4. Confirm "View Keyboard Shortcuts" is visible.
5. Click "View Keyboard Shortcuts".
6. Wait 1 second for the overlay to open and the dropdown to close.
7. Verify the keyboard shortcuts overlay `.shortcuts` is now visible.
8. Confirm the dropdown (list of menu items) is no longer visible.
   Check that the text "Download Messages" is **not** visible in the dropdown.
9. Close the shortcuts overlay by clicking `[data-testid="rancher-ai-ui-chat-container"]`
   at coordinates (10, 200).
10. Take a screenshot named `chat-panel-menu-mcp-test-9-dropdown-auto-close`.

**Assertions**:
- After clicking "View Keyboard Shortcuts", the dropdown list is closed (no menu items visible)
- The shortcuts overlay `.shortcuts` opens correctly
- The menu trigger button `.chat-console-menu-container button` is still visible in the header
  (menu can be re-opened)

**Selectors**:
- `.chat-console-menu-container button`
- `.shortcuts`
- Text "Download Messages" should not be visible in a dropdown after selection

**Screenshot**: `chat-panel-menu-mcp-test-9-dropdown-auto-close`

---

## Implementation Notes

### Mock API Details

- **Proxy base URL**: `https://localhost:8005/api/v1/namespaces/cattle-ai-agent-system/services/http:llm-mock:80/proxy`
- **Push endpoint**: `{proxy-base}/v1/control/push` — HTTP POST with JSON body
- **Clear endpoint**: `{proxy-base}/v1/control/clear` — HTTP POST (no body)
- **Authentication**: Include `Cookie: R_SESS=<token>` header (token obtained from login session)
- **Do NOT use** `http://localhost:1080/mockserver/expectation` — the quick reference URL is
  incorrect; the Rancher proxy path is the authoritative endpoint

### Message ID Sequencing

For Test 4, after opening a new chat:
- Message ID 1 = AI welcome message (sent automatically on connect)
- Message ID 2 = AI response to the user's "Download test message"

Reference selector: `[data-testid="rancher-ai-ui-chat-message-box-2"]`

### Download Intercept Pattern

For Test 4, intercept `window.URL.createObjectURL` before clicking the menu. In Playwright:
```js
await page.evaluate(() => {
  window._downloadBlobCalled = false;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    window._downloadBlobCalled = true;
    return orig(blob);
  };
});
// ... after clicking Download Messages:
const called = await page.evaluate(() => window._downloadBlobCalled);
expect(called).toBe(true);
```

### Outside-Click Pattern

For Tests 3, 7, and 9, to dismiss a dropdown or overlay without closing the chat panel:
- Click `[data-testid="rancher-ai-ui-chat-container"]` at position `{ x: 10, y: 200 }`
- Do **not** use `[data-testid="rancher-ai-ui-chat-close-button"]` — this closes the entire panel

### Selector Not Available Warning

- `rancher-ai-ui-chat-menu-button` — This `data-testid` does **not** exist in source code,
  despite appearing in some documentation. Always use `.chat-console-menu-container button`.
