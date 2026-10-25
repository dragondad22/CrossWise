#!/usr/bin/env bash
# What a release does to the database (#139, dark-factory decision 22), for deploy.yml. Run from a
# checkout of the release, with the names of the migrations production has already applied on
# stdin, one per line. Prints, for $GITHUB_OUTPUT:
#   pending=<the migrations production hasn't applied, space-separated; empty if none>
#   expand_only=true|false
# Pending is measured against the database, not the last tag, so a migration left over from a
# release that failed part-way is counted too. A release is expand-only when each pending migration
# passes squawk (.squawk.toml) with no `squawk-ignore` comment: the squawk rules left on are the ones
# that catch a change breaking the code still running (ADR-002 §2.5). Only then may deploy.yml roll
# the app back on its own.
# Usage: psql … | scripts/release-plan.sh
set -euo pipefail
cd "$(dirname "$0")/.."

declare -A applied=()
while IFS= read -r name; do
  [ -n "$name" ] && applied["$name"]=1
done

pending=()
expand_only=true
for f in prisma/migrations/*/migration.sql; do
  name=$(basename "$(dirname "$f")")
  [ -n "${applied[$name]:-}" ] && continue
  pending+=("$name")
  if grep -q 'squawk-ignore' "$f"; then
    echo "release-plan: $name says squawk-ignore, so it isn't expand-only" >&2
    expand_only=false
  elif ! npx squawk "$f" >&2; then
    expand_only=false
  fi
done

echo "pending=${pending[*]}"
echo "expand_only=$expand_only"
