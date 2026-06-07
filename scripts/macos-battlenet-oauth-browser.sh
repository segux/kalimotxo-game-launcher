#!/bin/bash
# Wrapper BROWSER para Wine/Battle.net en macOS.
# Abre OAuth en el navegador del sistema; en callbacks localhost hace curl para
# que Agent.exe reciba la petición si el reenvío de puertos falla.
URL="${1:-}"
DATA="${KALIMOTXO_DATA:-${HOME}/.kalimotxo}"
[[ -d "${DATA}" ]] || DATA="${HOME}/.macbattlenet"
LOG="${DATA}/logs/oauth-browser.log"
mkdir -p "$(dirname "$LOG")"
printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$URL" >>"$LOG"
if [[ "$URL" =~ ^https?://(127\.0\.0\.1|localhost)(:[0-9]+)?/ ]]; then
  /usr/bin/curl -fsS -m 20 "$URL" >>"$LOG" 2>&1 || true
fi
if [[ -n "$URL" ]]; then
  /usr/bin/open "$URL" 2>/dev/null || true
fi
exit 0
