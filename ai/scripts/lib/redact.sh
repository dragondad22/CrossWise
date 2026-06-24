#!/usr/bin/env bash
# redact.sh — domain-neutral secret-redaction helper.
#
# Sourced by other scripts; `redact_file <path>` rewrites the file in place,
# masking the most common ways credentials leak into logs/artifacts:
#   - Authorization: Bearer <token>
#   - shell-style assignments of *PASSWORD / *TOKEN / *SECRET / *API_KEY (and DATABASE_URL)
#   - JSON/quoted fields named password/secret/token/apiKey/...
#   - DB connection URLs with inline credentials (postgres/mysql/mongodb/redis/amqp)
#
# This is a best-effort scrubber, not a guarantee — never rely on it as the only
# control. Keep secrets out of logs at the source where you can.

redact_file() {
  local file="${1:-}"

  if [ -z "$file" ] || [ ! -f "$file" ]; then
    return 0
  fi

  sed -E -i \
    -e 's#(Authorization:[[:space:]]*Bearer[[:space:]]+)[^[:space:]]+#\1[REDACTED]#gI' \
    -e 's#(([a-zA-Z]+)://[^:/[:space:]]+):[^@[:space:]]+@#\1:[REDACTED]@#g' \
    -e 's#(([A-Za-z0-9_]*(PASSWORD|TOKEN|SECRET|API_KEY)|DATABASE_URL|DB_URL)[[:space:]]*=[[:space:]]*)[^[:space:]]+#\1[REDACTED]#g' \
    -e 's#("(password|passwd|secret|apiKey|api_key|authToken|sessionToken|accessToken|refreshToken|resetToken|token)"[[:space:]]*:[[:space:]]*")([^"]+)#\1[REDACTED]#gI' \
    -e "s#('(password|passwd|secret|apiKey|api_key|authToken|sessionToken|accessToken|refreshToken|resetToken|token)'[[:space:]]*:[[:space:]]*')([^']+)#\\1[REDACTED]#gI" \
    "$file" || true
}
