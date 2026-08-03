#!/bin/bash

# Helper script to start the extension catalog server (serve-pkgs) in the background.
#
# The built extension bundle is served from here and developer-loaded into Rancher's own
# dashboard via a UIPlugin CR (see register-extension.sh). Run `yarn build-pkg` first.
#
# Usage: start-extension-server.sh [PORT] [LOG_FILE]

set -e

PORT=${1:-8080}
LOG_FILE=${2:-serve-pkgs.log}

echo "Starting the extension catalog server on port ${PORT} (log: ${LOG_FILE}) ..."

PORT="$PORT" nohup yarn serve-pkgs > "$LOG_FILE" 2>&1 &

echo ""
echo "Waiting for the extension catalog to be served ..."
TIME=0
until curl -sf -m 5 -o /dev/null "http://127.0.0.1:${PORT}/"; do
  sleep 2
  TIME=$((TIME + 2))
  echo "${TIME}s ..."
  if [ $TIME -ge 120 ]; then
    echo "ERROR: the extension catalog server did not come up in a reasonable time"
    cat "$LOG_FILE" || true
    exit 1
  fi
done

echo ""
echo "Extension catalog:"
curl -s "http://127.0.0.1:${PORT}/" | head -40

echo ""
echo "Done."
