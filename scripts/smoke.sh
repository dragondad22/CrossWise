#!/usr/bin/env bash
# Checks that a CrossWise deployment answers (#139). deploy.yml runs it on production after every
# release; if it fails there, the release is rolled back. Usage: scripts/smoke.sh <base-url>
#   - the home page answers 200
#   - /api/health answers 200: the app is up and reaches its database
#   - /login sends you to the accounts service to sign in
# A new deployment can take a few seconds to take over the domain, so a failed round is tried
# again, up to SMOKE_TRIES times (default 6), 10 seconds apart.
set -euo pipefail

base="${1:?usage: scripts/smoke.sh <base-url>}"
base="${base%/}"
accounts="${SMOKE_ACCOUNTS_URL:-https://accounts.buildyouralpaca.com}"
tries="${SMOKE_TRIES:-6}"

# Prints "<status> <redirect URL>" for a GET, without following redirects; "000" if it never answered.
answer() { curl -sS -o /dev/null --max-time 20 -w '%{http_code} %{redirect_url}' "$1" 2>/dev/null || true; }

round() {
  local ok=0 got
  got=$(answer "$base/")
  if [ "${got%% *}" = 200 ]; then echo "ok    home page"; else echo "FAIL  home page answered ${got%% *}"; ok=1; fi
  got=$(answer "$base/api/health")
  if [ "${got%% *}" = 200 ]; then echo "ok    /api/health"; else echo "FAIL  /api/health answered ${got%% *}"; ok=1; fi
  got=$(answer "$base/login")
  case "$got" in
    30[1278]" $accounts/sign-in"*) echo "ok    /login sends you to $accounts" ;;
    *) echo "FAIL  /login answered '$got', not a redirect to $accounts/sign-in"; ok=1 ;;
  esac
  return "$ok"
}

for try in $(seq 1 "$tries"); do
  echo "smoke: $base, try $try of $tries"
  if round; then echo "smoke: passed"; exit 0; fi
  [ "$try" -lt "$tries" ] && sleep 10
done
echo "smoke: failed" >&2
exit 1
