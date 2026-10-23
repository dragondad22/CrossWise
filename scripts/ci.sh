#!/usr/bin/env bash
# CrossWise's one CI script (#138). The PR check on GitHub runs it, the dark factory runs it in its
# box, and you run it before a PR. It stops at the first failure.
#
# DATABASE_URL must point at a throwaway Postgres: the last step applies every migration to it.
# Locally, for example:
#   docker run --rm -d --name crosswise-ci -p 5433:5432 -e POSTGRES_PASSWORD=ci postgres:17
#   DATABASE_URL=postgresql://postgres:ci@localhost:5433/postgres bash scripts/ci.sh
#
# CI_BASE is the commit this branch is checked against: squawk lints the migrations changed since
# then. By default, the point where the branch left main.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n==> %s\n' "$1"; }
fail() { printf 'ci: %s\n' "$1" >&2; exit 1; }

# No telemetry from CI. In the box these calls are refused anyway.
export NEXT_TELEMETRY_DISABLED=1 CHECKPOINT_DISABLE=1

# Checked before the slow steps. Only the environment counts: prisma.config.ts also reads .env,
# which may point at a real database.
db="${DATABASE_URL:-}"
[ -n "$db" ] || fail "set DATABASE_URL to a throwaway Postgres (see the top of this script)"
case "$db" in
  *neon.tech*) fail "DATABASE_URL points at Neon; this script only migrates a throwaway database" ;;
esac

base="${CI_BASE:-}"
if [ -z "$base" ]; then
  for ref in main origin/main; do
    base=$(git merge-base HEAD "$ref" 2>/dev/null) && break
  done
fi
[ -n "$base" ] || fail "can't tell where this branch left main; set CI_BASE"

step "install"
npm ci --no-audit --no-fund

step "lint"
npm run lint

step "type check"
npx tsc --noEmit

step "tests"
npm test -- ${TEST_WORKERS:+--maxWorkers="$TEST_WORKERS"}

step "build"
npm run build

step "version sync"
bash ai/scripts/check-version-sync.sh

step "dependency audit"
npm audit --audit-level=high --omit=dev

step "secret scan"
git ls-files -z | xargs -0 npx secretlint --maskSecrets

step "migration lint"
# Only the migrations this branch changes: the old ones are already applied. .squawk.toml has the
# rules that are off; a migration that must break one says so in a `-- squawk-ignore` comment.
mapfile -t changed < <(git diff --name-only --diff-filter=d "$base" -- 'prisma/migrations/*.sql')
if [ "${#changed[@]}" -eq 0 ]; then
  echo "no migrations changed since $(git rev-parse --short "$base")"
else
  npx squawk "${changed[@]}"
fi

step "migrations"
npx prisma migrate deploy
npx prisma migrate status

printf '\nci: all green\n'
