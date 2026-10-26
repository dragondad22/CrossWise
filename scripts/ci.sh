#!/usr/bin/env bash
# CrossWise's one CI script (#138). The PR check on GitHub runs it, the dark factory runs it in its
# box, and you run it before a PR. It stops at the first failure.
#
# DATABASE_URL must point at a throwaway Postgres: the last step applies every migration to it.
# Its host must be localhost (GitHub's service container, or your own) or `postgres` (the service
# beside the dark factory's box). Locally, for example:
#   docker run --rm -d --name crosswise-ci -p 5433:5432 -e POSTGRES_PASSWORD=ci postgres:17
#   DATABASE_URL=postgresql://postgres:ci@localhost:5433/postgres bash scripts/ci.sh
#
# CI_BASE is the commit this branch is checked against: squawk lints the migrations changed since
# then. By default, the point where the branch left main.
#
# CI_JUNIT, when set, is where the tests also write a JUnit report. The dark factory sets it, and
# reads the report to see that the tests really ran.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n==> %s\n' "$1"; }
fail() { printf 'ci: %s\n' "$1" >&2; exit 1; }

# No telemetry from CI. In the box these calls are refused anyway.
export NEXT_TELEMETRY_DISABLED=1 CHECKPOINT_DISABLE=1

# Checked before the slow steps. Only the environment counts: prisma.config.ts also reads .env,
# which may point at a real database, but never in place of a value already set.
[ -n "${DATABASE_URL:-}" ] || fail "set DATABASE_URL to a throwaway Postgres (see the top of this script)"
host=$(node -e 'try { console.log(new URL(process.env.DATABASE_URL).hostname) } catch { process.exit(1) }') ||
  fail "DATABASE_URL isn't a URL"
case "$host" in
  localhost | 127.0.0.1 | '[::1]' | postgres) ;;
  *) fail "DATABASE_URL's host is $host; this script only migrates a throwaway database (see the top)" ;;
esac

base="${CI_BASE:-}"
if [ -z "$base" ]; then
  for ref in origin/main main; do
    base=$(git merge-base HEAD "$ref" 2>/dev/null) && break
  done
fi
[ -n "$base" ] || fail "can't tell where this branch left main; set CI_BASE"
git rev-parse -q --verify "$base^{commit}" >/dev/null || fail "CI_BASE ($base) isn't a commit here"

step "install"
npm ci --no-audit --no-fund

step "lint"
npm run lint

step "type check"
npx tsc --noEmit

step "tests"
npm test -- ${TEST_WORKERS:+--maxWorkers="$TEST_WORKERS"} \
  ${CI_JUNIT:+--reporter=default --reporter=junit --outputFile.junit="$CI_JUNIT"}

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
# Listed to a file first: a failing git inside <(…) wouldn't stop the script.
list=$(mktemp)
trap 'rm -f "$list"' EXIT
git diff -z --name-only --diff-filter=d "$base" -- 'prisma/migrations/*.sql' >"$list"
mapfile -d '' -t changed <"$list"
if [ "${#changed[@]}" -eq 0 ]; then
  echo "no migrations changed since $(git rev-parse --short "$base")"
else
  npx squawk "${changed[@]}"
fi

step "migrations"
npx prisma migrate deploy
npx prisma migrate status

printf '\nci: all green\n'
