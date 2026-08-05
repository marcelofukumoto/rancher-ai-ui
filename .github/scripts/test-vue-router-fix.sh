#!/bin/bash

# Test rancher/dashboard PR #18657 ("vue-router compat for extension builds") against this
# extension.
#
# What the dashboard PR does: it stops externalising `vue-router` to the host global
# `window.__vueRouter` (which only Rancher >= 2.15 provides) and instead routes it through a
# compat stub (shell/pkg/vue-router.lib.js) wired in shell/pkg/vue.config.js. The net effect on
# ANY extension built against the patched shell is:
#   - `vue-router` is no longer a load-time external in the UMD wrapper (no require("__vueRouter"))
#   - the compat stub is bundled in its place
#   - the build log has no `export 'X' was not found in 'vue-router'` warnings
#   - the extension's action menus / list views stop throwing
#     `Cannot read properties of undefined (reading 'useRoute')` on Rancher 2.11-2.14
#
# NOTE on the check: the PR's manual instructions say `grep -c "__vueRouter" == 0`, but that is
# misleading for a minified single-line bundle - `grep -c` counts matching *lines* (0/1), and the
# fix's own stub legitimately still contains `window.__vueRouter` (its 2.15+ pass-through). So we
# assert the precise signal instead: the UMD wrapper's `require("__vueRouter")` external binding
# is gone (the load-time crash source), and the stub module is present in its place.
#
# The change lives entirely in shell/pkg/*, which is only read by `yarn build-pkg`. So we can
# test it without a full dashboard checkout or `yarn link`: overlay the PR's two changed files
# onto the installed `@rancher/shell`, rebuild this extension, and assert on the output. The
# original shell files are restored on exit.
#
# The runtime half of the fix (loading the rebuilt bundle into a Rancher <= 2.14 and confirming
# the action menu works) still needs a real old-Rancher instance and is out of scope here; see
# README-vue-router-test.md for how to do that manually with the artifact this produces.
#
# Usage: test-vue-router-fix.sh [--pr N] [--repo owner/name] [--baseline] [--keep]
#   --pr N         dashboard PR number (default 18657)
#   --repo R       dashboard repo (default rancher/dashboard)
#   --baseline     also build WITHOUT the fix first, to prove the bundle references __vueRouter
#                  before the patch (expected count >= 1) and 0 after
#   --keep         leave the patched shell + dist-pkg in place instead of restoring

set -euo pipefail

PR=18657
REPO=rancher/dashboard
BASELINE=0
KEEP=0
DO_BUILD=1
DO_UNIT=1
EXT=rancher-ai-ui

while [ $# -gt 0 ]; do
  case "$1" in
    --pr)         PR="$2"; shift 2 ;;
    --repo)       REPO="$2"; shift 2 ;;
    --baseline)   BASELINE=1; shift ;;
    --keep)       KEEP=1; shift ;;
    --skip-build) DO_BUILD=0; shift ;;   # only run the useRoute unit tests
    --skip-unit)  DO_UNIT=0; shift ;;    # only run the bundle build check
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SHELL_PKG="node_modules/@rancher/shell/pkg"
VUE_CONFIG="$SHELL_PKG/vue.config.js"
VUE_ROUTER_LIB="$SHELL_PKG/vue-router.lib.js"
UNIT_DIR=".vue-router-fix-test"   # temp home for the PR's stub unit test (jest testMatch picks it up)

if [ ! -f "$VUE_CONFIG" ]; then
  echo "ERROR: $VUE_CONFIG not found - run 'yarn install' first"
  exit 1
fi

TMP="$(mktemp -d)"
BUILD_LOG="$TMP/build.log"

# ---------------------------------------------------------------------------
# Restore the installed shell to its pristine state on exit (unless --keep).
# ---------------------------------------------------------------------------
cp "$VUE_CONFIG" "$TMP/vue.config.js.orig"
restore() {
  rm -rf "$UNIT_DIR"
  if [ "$KEEP" = "1" ]; then
    echo ""
    echo "--keep set: leaving patched shell and dist-pkg in place."
    echo "  patched:  $VUE_CONFIG, $VUE_ROUTER_LIB"
    return
  fi
  cp "$TMP/vue.config.js.orig" "$VUE_CONFIG"
  # vue-router.lib.js does not exist in the published shell - remove what we added.
  rm -f "$VUE_ROUTER_LIB"
  echo ""
  echo "Restored $SHELL_PKG to its original state."
}
trap restore EXIT

# ---------------------------------------------------------------------------
# Resolve the PR head and download the two changed shell files.
# ---------------------------------------------------------------------------
echo "Resolving $REPO PR #$PR ..."
META=$(gh pr view "$PR" --repo "$REPO" --json headRepositoryOwner,headRepository,headRefOid,headRefName)
OWNER=$(echo "$META" | jq -r '.headRepositoryOwner.login')
NAME=$(echo "$META" | jq -r '.headRepository.name')
SHA=$(echo "$META" | jq -r '.headRefOid')
BRANCH=$(echo "$META" | jq -r '.headRefName')
echo "  head: $OWNER/$NAME @ $BRANCH ($SHA)"

RAW="https://raw.githubusercontent.com/$OWNER/$NAME/$SHA/shell/pkg"
download() {
  if ! curl -fsSL "$RAW/$1" -o "$TMP/$(basename "$1")"; then
    echo "ERROR: could not download shell/pkg/$1 from the PR head ($RAW/$1)"
    exit 1
  fi
}
download vue.config.js
download vue-router.lib.js
[ "$DO_UNIT" = "1" ] && download __tests__/vue-router.lib.test.ts
echo "  downloaded the changed shell/pkg files from the PR"

UMD_GLOB="dist-pkg/${EXT}-*/${EXT}-*.umd.min.js"
STUB_MARKER="not available to extensions on this Rancher version"

umd_path() {
  # shellcheck disable=SC2086 - deliberate glob
  local umd
  umd=$(ls $UMD_GLOB 2>/dev/null | head -1)
  if [ -z "$umd" ]; then
    echo "ERROR: built bundle not found ($UMD_GLOB)" >&2; exit 1
  fi
  echo "$umd"
}

build() {
  rm -rf dist-pkg
  echo ""
  echo "Building extension ($EXT) ..."
  yarn build-pkg "$EXT" > "$BUILD_LOG" 2>&1 || { echo "ERROR: build failed"; tail -40 "$BUILD_LOG"; exit 1; }
}

# The load-time external binding that crashes on Rancher <= 2.14. The UMD wrapper emits
# require("__vueRouter") in its commonjs branches when vue-router is externalised; 0 of these
# means vue-router is no longer a hard host dependency.
# `|| true` masks grep's exit 1 on zero matches so it doesn't trip `set -o pipefail`.
count_umd_external() { { grep -o 'require("__vueRouter")' "$(umd_path)" || true; } | wc -l | tr -d ' '; }
# Total residual mentions (post-fix this is the stub's own optional window.__vueRouter read).
count_global_refs()  { { grep -o '__vueRouter' "$(umd_path)" || true; } | wc -l | tr -d ' '; }
# Presence of the compat stub itself (proves it replaced the external).
stub_present()       { grep -c "$STUB_MARKER" "$(umd_path)" || true; }

FAIL=0

# ---------------------------------------------------------------------------
# BUILD CHECK: build the extension and prove vue-router is no longer a load-time
# external in the bundle (the actual application/extension build).
# ---------------------------------------------------------------------------
if [ "$DO_BUILD" = "1" ]; then
  if [ "$BASELINE" = "1" ]; then
    echo ""
    echo "=================== BASELINE build (no fix) ==================="
    build
    echo "  require(\"__vueRouter\") UMD external bindings: $(count_umd_external)   (expected >= 1)"
    echo "  __vueRouter total mentions:                    $(count_global_refs)"
    echo "  compat stub bundled:                           $(stub_present)   (expected 0)"
  fi

  echo ""
  echo "=================== BUILD with fix (PR #$PR) ==================="
  cp "$TMP/vue.config.js" "$VUE_CONFIG"
  cp "$TMP/vue-router.lib.js" "$VUE_ROUTER_LIB"
  echo "  overlaid patched shell files"
  build

  EXTERNAL=$(count_umd_external)
  TOTAL=$(count_global_refs)
  STUB=$(stub_present)
  MISSING_EXPORTS=$(grep -c "was not found in 'vue-router'" "$BUILD_LOG" || true)

  echo "  require(\"__vueRouter\") UMD external bindings: $EXTERNAL   (expected 0)"
  echo "  __vueRouter total mentions:                    $TOTAL   (the stub's 2.15+ pass-through)"
  echo "  compat stub bundled:                           $STUB   (expected >= 1)"
  echo "  \"was not found in 'vue-router'\" warnings:       $MISSING_EXPORTS   (expected 0)"

  if [ "$EXTERNAL" != "0" ]; then
    echo "  FAIL: vue-router is still a load-time UMD external - the fix did not take effect."; FAIL=1
  fi
  if [ "$STUB" = "0" ]; then
    echo "  FAIL: compat stub not found in the bundle - vue-router was not replaced."; FAIL=1
  fi
  if [ "$MISSING_EXPORTS" != "0" ]; then
    echo "  FAIL: build emitted missing-export warnings for vue-router:"
    grep "was not found in 'vue-router'" "$BUILD_LOG" | sed 's/^/      /'; FAIL=1
  fi
fi

# ---------------------------------------------------------------------------
# UNIT CHECK: run the PR's own vue-router stub unit tests here, against the
# overlaid stub. This exercises the actual useRoute()/useRouter() code paths -
# forwarding to the host on Rancher >= 2.15, and the $route/$router fallback on
# <= 2.14 - which the build check alone does not execute.
#
# The stub is resolved via jest's `@shell/*` moduleNameMapper -> the installed
# @rancher/shell, i.e. the file we overlaid above; no webpack involved.
# ---------------------------------------------------------------------------
if [ "$DO_UNIT" = "1" ]; then
  echo ""
  echo "=================== UNIT: useRoute()/useRouter() stub tests ==================="
  # Ensure the stub is overlaid even when --skip-build meant we didn't do it above.
  cp "$TMP/vue-router.lib.js" "$VUE_ROUTER_LIB"
  mkdir -p "$UNIT_DIR/__tests__"
  cp "$TMP/vue-router.lib.test.ts" "$UNIT_DIR/__tests__/vue-router.lib.test.ts"

  # Ignore dist-pkg so the built bundle's package.json doesn't cause a jest haste collision.
  if npx jest "$UNIT_DIR" --modulePathIgnorePatterns '/dist-pkg/' '/cypress/' '/scripts/' > "$TMP/unit.log" 2>&1; then
    grep -E "^Tests:" "$TMP/unit.log" | sed 's/^/  /'
    echo "  PASS: the stub's useRoute()/useRouter() behaviour is verified."
  else
    echo "  FAIL: stub unit tests failed:"
    tail -40 "$TMP/unit.log" | sed 's/^/      /'
    FAIL=1
  fi
fi

# ---------------------------------------------------------------------------
echo ""
echo "=================== RESULT ==================="
if [ "$FAIL" = "0" ]; then
  echo "PASS - dashboard PR #$PR verified against $EXT:"
  [ "$DO_BUILD" = "1" ] && echo "  - the extension build no longer externalises vue-router (compat stub bundled)"
  [ "$DO_UNIT" = "1" ]  && echo "  - the stub's useRoute()/useRouter() behaviour passes its unit tests"
  [ "$DO_BUILD" = "1" ] && echo "  The dist-pkg/ bundle is safe to dev-load into Rancher 2.11-2.14 (use --keep, then yarn serve-pkgs)."
else
  echo "FAIL - see above."
fi

exit $FAIL
