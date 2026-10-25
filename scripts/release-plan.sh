#!/usr/bin/env bash
# What a release changes in the database (#139, dark-factory decision 22), for deploy.yml. Run from
# a checkout of the tag. Prints, for $GITHUB_OUTPUT:
#   previous=<the v* tag before this one>
#   migrations=<the migration files changed since it, space-separated; empty if none>
#   expand_only=true|false
# A release is expand-only when each of its migrations passes squawk (.squawk.toml) with no
# `squawk-ignore` comment: squawk's rules that stay on are the ones that catch a change breaking the
# code still running (ADR-002 §2.5). Only then may deploy.yml roll the app back on its own.
# Usage: scripts/release-plan.sh <tag>
set -euo pipefail
cd "$(dirname "$0")/.."

fail() { printf 'release-plan: %s\n' "$1" >&2; exit 1; }

tag="${1:?usage: scripts/release-plan.sh <tag>}"
git rev-parse -q --verify "$tag^{commit}" >/dev/null || fail "$tag isn't a commit here"
previous=$(git describe --tags --abbrev=0 --match 'v*' "$tag^" 2>/dev/null) || fail "no v* tag before $tag"

# Listed to a file first: a failing git inside <(…) wouldn't stop the script.
list=$(mktemp)
trap 'rm -f "$list"' EXIT
git diff -z --name-only --diff-filter=d "$previous" "$tag" -- 'prisma/migrations/*.sql' >"$list"
mapfile -d '' -t migrations <"$list"

expand_only=true
for f in "${migrations[@]}"; do
  if grep -q 'squawk-ignore' "$f"; then
    echo "release-plan: $f says squawk-ignore, so it isn't expand-only" >&2
    expand_only=false
  elif ! npx squawk "$f" >&2; then
    expand_only=false
  fi
done

echo "previous=$previous"
echo "migrations=${migrations[*]}"
echo "expand_only=$expand_only"
