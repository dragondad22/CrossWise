#!/usr/bin/env bash
# Vercel's REST API, for deploy.yml (#139, #149): which deployment the production domain serves, and
# moving it to another one. The Vercel CLI's promote and rollback look up the token's user first,
# which a team token doesn't have ("User not found"), so these call the API directly.
# Needs VERCEL_TOKEN, VERCEL_PROJECT_ID and PRODUCTION_URL in the environment (VERCEL_ORG_ID too,
# when the project belongs to a team). VERCEL_API stands in for https://api.vercel.com in tests.
#   scripts/vercel.sh serving             the id of the deployment the production domain serves
#   scripts/vercel.sh id <deployment-url>  a deployment's id
#   scripts/vercel.sh promote <id>         points the production domain at a deployment, and waits
#                                          until it serves it (5 minutes at most)
#   scripts/vercel.sh rollback <id>        the same, back to an earlier production deployment
set -euo pipefail

: "${VERCEL_TOKEN:?}" "${VERCEL_PROJECT_ID:?}" "${PRODUCTION_URL:?}"
scope=""
case "${VERCEL_ORG_ID:-}" in team_*) scope="teamId=$VERCEL_ORG_ID" ;; esac
domain="${PRODUCTION_URL#https://}"
domain="${domain%%/*}"

# api <method> <path>: prints the response body. An HTTP error fails, with Vercel's message. A POST
# sends an empty JSON body, which Vercel requires; each request gives up after 30 seconds.
api() {
  local method="$1" path="$2" sep='?' body status data=()
  [[ "$path" == *\?* ]] && sep='&'
  [ "$method" = POST ] && data=(-H 'Content-Type: application/json' --data '{}')
  body=$(mktemp)
  status=$(curl -sS --connect-timeout 10 --max-time 30 -o "$body" -w '%{http_code}' -X "$method" \
    -H "Authorization: Bearer $VERCEL_TOKEN" "${data[@]}" \
    "${VERCEL_API:-https://api.vercel.com}$path${scope:+$sep$scope}") || status=000
  if [ "${status:0:1}" != 2 ]; then
    echo "vercel: $method $path answered $status: $(jq -r '.error.message // empty' "$body" 2>/dev/null)" >&2
    rm -f "$body"
    return 1
  fi
  cat "$body"
  rm -f "$body"
}

serving() { api GET "/v4/aliases/$domain" | jq -er '.deploymentId'; }

# point <promote|rollback> <deployment id>
point() {
  local how="$1" id="$2"
  case "$how" in
    promote) api POST "/v10/projects/$VERCEL_PROJECT_ID/promote/$id" >/dev/null ;;
    rollback) api POST "/v1/projects/$VERCEL_PROJECT_ID/rollback/$id" >/dev/null ;;
  esac
  local deadline=$((SECONDS + 300))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if [ "$(serving 2>/dev/null || true)" = "$id" ]; then
      echo "vercel: $domain serves $id"
      return 0
    fi
    sleep 5
  done
  echo "vercel: $domain still doesn't serve $id after 5 minutes" >&2
  return 1
}

case "${1:-}" in
  serving) serving ;;
  id)
    url="${2:?deployment URL}"
    api GET "/v13/deployments/${url#https://}" | jq -er '.id'
    ;;
  promote | rollback) point "$1" "${2:?deployment id}" ;;
  *)
    echo "usage: scripts/vercel.sh serving | id <deployment-url> | promote <id> | rollback <id>" >&2
    exit 2
    ;;
esac
