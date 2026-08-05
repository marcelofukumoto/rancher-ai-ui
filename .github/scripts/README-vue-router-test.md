# Testing dashboard PR #18657 (vue-router extension-build fix) with rancher-ai-ui

[rancher/dashboard#18657](https://github.com/rancher/dashboard/pull/18657) fixes extension
builds so the 3-dot action menu (and any other `@shell` component that calls
`useRoute()`/`useRouter()`) stops crashing with
`Cannot read properties of undefined (reading 'useRoute')` when the extension is loaded into
**Rancher 2.11–2.14**.

Before the fix, `vue-router` is externalised to the host global `window.__vueRouter`, which only
Rancher **2.15+** provides — so on older hosts it resolves to `undefined` and every router call
throws at `setup()` time. The fix routes `vue-router` through a compat stub bundled inside the
extension instead. It changes only `shell/pkg/*`, which is read solely by `yarn build-pkg`.

## 1. Automated test (no cluster needed)

```bash
# From the repo root. Requires: gh (authenticated), node >= 24, deps installed (yarn install).
./.github/scripts/test-vue-router-fix.sh --baseline
```

It overlays the PR's changed shell files onto the installed `@rancher/shell`, then runs two
independent checks, then restores the original shell files. It runs **both** by default.

### 1a. Build check — does the extension build stop externalising vue-router?

Rebuilds this extension (`yarn build-pkg`, the build the PR actually affects — the Rancher host
app build is untouched) and inspects the bundle. `--baseline` first builds **without** the fix so
you can see the difference:

| | require("__vueRouter") in UMD wrapper | compat stub bundled |
|---|---|---|
| **without fix** | 2 (load-time external — the crash source) | no |
| **with fix**    | 0 | yes |

`PASS` means `vue-router` is no longer a load-time external and the stub is bundled in its place.

> The PR's own instructions say `grep -c "__vueRouter" == 0`. That check is misleading on a
> minified single-line bundle (`grep -c` counts lines, and the fix's stub legitimately keeps a
> `window.__vueRouter` pass-through for 2.15+). This script asserts the precise signal instead:
> the `require("__vueRouter")` external binding disappears and the stub module appears.

### 1b. Unit check — does useRoute()/useRouter() actually work?

The build check proves the bundle changed but never *runs* `useRoute()`. This step runs the PR's
own stub unit tests (`shell/pkg/__tests__/vue-router.lib.test.ts`, 34 cases) in this repo against
the overlaid stub, exercising the real code paths: forwarding to the host global on Rancher
>= 2.15, and the `$route`/`$router` fallback on <= 2.14. It works because jest resolves
`@shell/pkg/vue-router.lib` (via `moduleNameMapper`) to the overlaid stub — no webpack, no
cluster. Note this extension doesn't call `useRoute()` in its own code (the crash comes from
bundled `@shell` components like `ActionMenuShell`), so the stub's own tests are the right unit
surface.

Flags: `--pr N` (default 18657), `--repo owner/name` (default rancher/dashboard), `--baseline`,
`--keep` (leave the patched shell + `dist-pkg/` in place — use before the manual step below),
`--skip-unit` (build check only), `--skip-build` (useRoute unit test only — ~1s, no build).

## 2. Runtime test (manual — needs an old Rancher)

The build-time test proves the bundle changed; to confirm the *runtime* crash is gone you still
need a Rancher **2.14.x** (or 2.11–2.13) instance:

```bash
./.github/scripts/test-vue-router-fix.sh --keep   # builds the fixed bundle, leaves it in dist-pkg/
yarn serve-pkgs                                    # serve the built bundle at http://127.0.0.1:8080
```

Then, on the old Rancher:
1. Dev-load the extension from the serve-pkgs URL (Extensions → Manage → developer load), or
   register a `UIPlugin` CR pointing at it (see `.github/scripts/register-extension.sh`).
2. Deploy the AI agent chart it needs (`.github/scripts/deploy-rancher-ai.sh`).
3. Open the chat / any extension list view, open the browser console, and confirm:
   - the 3-dot action menu renders and its actions run, and
   - `Cannot read properties of undefined (reading 'useRoute')` does **not** appear.

When done, `git checkout -- .` / re-run `yarn install` if you used `--keep`, to drop the
overlaid shell files.

## 3. CI

`.github/workflows/test-vue-router-fix.yaml` runs step 1 on demand
(Actions → "Test vue-router fix (dashboard PR)" → Run workflow, with an optional PR number).
