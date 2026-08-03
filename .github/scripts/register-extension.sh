#!/bin/bash

# Helper script to developer-load the extension into Rancher's own dashboard.
#
# Reads the first entry of the extension catalog served by start-extension-server.sh and
# registers it as a UIPlugin CR, so Rancher's dashboard pulls the bundle from the catalog
# server instead of a published chart. Mirrors rancher/dashboard's developer load.
#
# Requires a kubeconfig for the cluster (KUBECONFIG env or arg).
#
# Usage: register-extension.sh [PORT] [KUBECONFIG_PATH]

set -e

PORT=${1:-8080}
KUBECONFIG_PATH=${2:-$KUBECONFIG}

if [ -z "$KUBECONFIG_PATH" ]; then
  echo "ERROR: kubeconfig path required (arg or KUBECONFIG env)"
  exit 2
fi

if [ ! -f "$KUBECONFIG_PATH" ]; then
  echo "ERROR: kubeconfig not found at $KUBECONFIG_PATH"
  exit 2
fi

export KUBECONFIG="$KUBECONFIG_PATH"

CATALOG_URL="http://127.0.0.1:${PORT}"

# `|| true` so a non-2xx / unreachable catalog reports the error below instead of tripping `set -e`.
CATALOG=$(curl -sf "${CATALOG_URL}/") || true
if [ -z "$CATALOG" ]; then
  echo "ERROR: no extension catalog served at ${CATALOG_URL}. Did you run 'yarn build-pkg' and start-extension-server.sh?"
  exit 1
fi

# The catalog is a JSON array of built packages; the extension is the first (only) entry.
read -r NAME VERSION MAIN <<< "$(echo "$CATALOG" | python3 -c "import sys,json; p=json.load(sys.stdin)[0]; print(p['name'], p['version'], p['main'])")"

if [ -z "$NAME" ] || [ -z "$VERSION" ] || [ -z "$MAIN" ]; then
  echo "ERROR: could not read name/version/main from the extension catalog:"
  echo "$CATALOG"
  exit 1
fi

MODULE="${NAME}-${VERSION}"
ENDPOINT="${CATALOG_URL}/${MODULE}/${MAIN}"

echo "Registering ${MODULE} from ${ENDPOINT}"

kubectl apply -f - <<EOF
apiVersion: catalog.cattle.io/v1
kind: UIPlugin
metadata:
  name: ${MODULE}
  namespace: cattle-ui-plugin-system
spec:
  plugin:
    name: ${NAME}-developer-load
    version: "${VERSION}"
    endpoint: ${ENDPOINT}
    noCache: true
    metadata:
      direct: "true"
      catalog.cattle.io/ui-extensions-version: ">= 3"
EOF

echo ""
echo "Done."
