#!/bin/bash
# Build Kalimotxo.dmg from dist/Kalimotxo.app
set -euo pipefail
cd "$(dirname "$0")/.."

APP="dist/Kalimotxo.app"
DMG="dist/Kalimotxo.dmg"

if [[ ! -d "$APP" ]]; then
  echo "Run ./scripts/build_app.sh first"
  exit 1
fi

rm -f "$DMG"
hdiutil create -volname "Kalimotxo" -srcfolder "$APP" -ov -format UDZO "$DMG"
echo "Created: $DMG"
