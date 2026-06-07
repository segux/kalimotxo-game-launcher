#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Kalimotxo onboarding verification =="
echo "Data dir will be: ${HOME}/.kalimotxo"
echo ""

pnpm run codecheck
pnpm run test:battlenet

export RUN_ONBOARDING=1
if [[ "${1:-}" == "--runtime-only" ]]; then
  export SKIP_BATTLENET_INSTALL=1
  echo "(Skipping Battle.net install; runtime + system only)"
fi

pnpm test -- src/backend/__tests__/onboarding.integration.test.ts --testTimeout=2700000

echo ""
echo "== Done. Check Battle.net status: =="
node -e "
const { execSync } = require('child_process');
try {
  execSync('ls -la ~/.kalimotxo/runtime/wine 2>/dev/null | head -3', { stdio: 'inherit' });
} catch {}
"
