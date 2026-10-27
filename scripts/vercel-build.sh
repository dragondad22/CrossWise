#!/usr/bin/env bash
# Vercel's build command (vercel.json). Production and plain previews just build: production's
# migrations run in deploy.yml, before the deploy. A preview with the test sign-in on (ADR-010)
# first gets its own database, with this branch's migrations and the sample data
# (scripts/preview-db.ts).
set -euo pipefail

if [ "${VERCEL_ENV:-}" = preview ] && [ "${PREVIEW_SIGN_IN:-}" = 1 ]; then
  npx tsx scripts/preview-db.ts
fi
npm run build
