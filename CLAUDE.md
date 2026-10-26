# CrossWise

A web app that turns vocabulary and term lists into shareable, auto-generated crossword puzzles. Live at
<https://crosswise.buildyouralpaca.com>, signing in through the shared Build Your Alpaca accounts service.

## Layout

- `src/app`: Next.js App Router pages, and the REST API under `src/app/api/v1`
- `src/components`: React UI · `src/lib`: puzzle generation, autosave, sign-in, the Zustand store
- `src/lib/validation.ts`: the API's Zod schemas, the one source of request and response shapes; `src/types/api.ts`
  derives the types from them. Don't hand-write request types.
- `prisma/`: the schema and migrations (PostgreSQL on Neon) · `tests/` and co-located `__tests__/`: Vitest

## Commands

```bash
npm run dev           # run it locally (sign-in goes to the accounts service; see .env.example)
npm test              # the tests;  npm run lint;  npm run build
bash scripts/ci.sh    # every check, as CI runs it; needs DATABASE_URL to a throwaway Postgres (top of the script)
npm run db:migrate    # author a migration (prisma migrate dev); never db:push against a shared database
```

## Non-negotiables

- Every query is scoped to the signed-in user: a user reads and writes only their own topics, lists, puzzles and solves.
- Sign-in, passwords and sessions live in the shared accounts service (ADR-009). CrossWise never handles passwords or
  issues sessions; every API route gets the user from `requireSession` in `src/lib/api-auth.ts`.
- `POST /api/v1/internal/account-deleted` checks its HMAC signature and timestamp before deleting anything.
- Autosave never silently loses solve progress, and server sync never overwrites newer local state.
- Puzzle generation is seeded: the same list and seed give the same puzzle.
- Users may be minors (13+, not verified). `docs/compliance/COMPLIANCE_REGISTER.md` says what that binds.
- Migrations are expand/contract (ADR-002): don't drop or tighten what running code still uses in the same release.

## Working here

- GitHub issues are the task list. Branch `<type>/<issue#>-<slug>`; PRs squash-merge, titled in Conventional
  Commits form, with `Closes #N`.
- No AI attribution trailers (`Co-Authored-By: Claude …`) in commit messages.
- A PR that changes what users see adds a line under `## [Unreleased]` in `CHANGELOG.md` and updates the docs it
  touches. Every data view has loading, empty and error states; destructive actions ask first.
- `docs/GLOSSARY.md` names things. A decision goes in `docs/decision-log.md` or an ADR, with Chris's OK, before code.
- Releases: `bash scripts/release.sh minor` (or `patch`) in a release PR. After Chris approves and merges it, its
  merge commit gets an annotated `v*` tag, which deploys production (`.github/workflows/deploy.yml`). Merges alone
  deploy nothing.
- The dark factory builds here too: `factory.toml` says how, and the `factory` label queues an issue.

Source of truth, in order: `prisma/schema.prisma`, the ADRs in `docs/architecture/decisions/`, `docs/decision-log.md`,
`docs/specs/CROSSWISE_SPEC.md`, `docs/uat/`, then the issues.
