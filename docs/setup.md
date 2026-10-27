# Setup & Operations

## Prerequisites
- Node.js 22 (what CI uses; Node 20 is end-of-life and the test suite no longer runs on it)
- npm (ships with Node)
- A PostgreSQL database of your own. The schema is PostgreSQL only; production runs on Neon. Use a Neon branch of
  the crosswise project (Neon console → Branches → New branch, e.g. `dev`), never the primary branch, which holds
  real users' data. Or run Postgres locally:
  `docker run -d --name crosswise-db -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:17`

## Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for your own database (above), read by Prisma and the app. | none |
| `ACCOUNTS_URL` | Shared accounts service that handles sign-in (ADR-009). | `https://accounts.buildyouralpaca.com` |
| `APP_URL` | CrossWise's own public URL; the accounts service sends users back here. | `https://crosswise.buildyouralpaca.com` |
| `ACCOUNT_WEBHOOK_SECRET` | Shared with the accounts service; verifies the account-deleted webhook. Required for account deletion to work. | none |

1. Copy `.env.example` to `.env` and fill it in. `.env` is gitignored.
2. The connection string's form is `postgresql://USER:PASSWORD@HOST:PORT/DB`, with `?sslmode=require` for Neon.

## Installation
```bash
npm install
```

## Database Management
Apply the migrations to your database (and, after a schema change, author a new one: ADR-002):
```bash
npm run db:migrate
```
Start over with an empty database, replayed migrations and the seed (your own database only):
```bash
npm run db:reset
```
Don't use `npm run db:push` on any shared database: it skips the migration history (ADR-002).

Generate the Prisma client into `src/generated/prisma` (runs on `npm install`; run it again after schema changes, since Prisma 7 `db:push` and `db:migrate` no longer do):
```bash
npm run db:generate
```

Seed with demo data (topics, lists) into your own account (see Local Sign-in below for your user id):
```bash
SEED_USER_ID=<your user id> SEED_USER_EMAIL=<your email> npm run seed
```
Without these, the seed creates a `demo@crosswise.dev` user that no one can sign in as.

Other seed script options:
```bash
npm run seed:clear   # Delete all data
npm run seed:reset   # Clear then reseed
```

To inspect data visually, launch Prisma Studio:
```bash
npm run db:studio
```

## Development Workflow
Start the Next.js dev server:
```bash
npm run dev -- -p 3001
# Visit http://localhost:3001 (port 3001 so sign-in works with the local accounts service; see below)
```

Build for production:
```bash
npm run build
```

Run every check, as CI does, before opening a PR. It needs `DATABASE_URL` pointing at a throwaway Postgres on
`localhost`, because its last step applies every migration (the top of `scripts/ci.sh` shows how):
```bash
bash scripts/ci.sh
```

Run the production server locally:
```bash
npm run start
```

## Linting & Formatting
- Lint: `npm run lint`
- Format: `npm run format`

Formatting uses Prettier 3 with the Tailwind plugin.

## Local Sign-in
CrossWise has no login of its own (ADR-009). Run the shared accounts service next to it:

1. Start the accounts service from `accounts/` in the buildyouralpaca repo (see its README). It runs on `http://localhost:3100`.
2. In the accounts service's `.env`, add `http://localhost:3001` to `APP_ORIGINS`.
3. In CrossWise's `.env`, set `ACCOUNTS_URL=http://localhost:3100` and `APP_URL=http://localhost:3001`.
4. Run CrossWise on port 3001 (`npm run dev -- -p 3001`). Cookies on `localhost` are shared across ports, so the accounts cookie reaches CrossWise.
5. Open `http://localhost:3001`, then sign in or create an account. Your user id is `user.id` at `http://localhost:3100/api/auth/get-session`.
6. Optional, to test account deletion: set the same `ACCOUNT_WEBHOOK_SECRET` in both `.env` files, and `ACCOUNT_DELETED_WEBHOOKS=http://localhost:3001/api/v1/internal/account-deleted` in the accounts service.

Sign out with the header's "Sign out" (`POST /api/v1/auth/logout`). It signs you out of the shared account.

## API Surface
- All HTTP endpoints live under the `/api/v1` prefix and follow RESTful resource conventions (`topics`, `lists`, `puzzles`, `solves`, `auth`).
- Example calls:
  - `GET /api/v1/topics` – list topics.
  - `POST /api/v1/lists` – import a new list.
  - `POST /api/v1/puzzles/generate` – spin up a crossword for a list.
- Versioning via the `v1` segment lets you evolve future APIs without breaking existing clients.

## Deployment Notes
- Production runs on Vercel at `https://crosswise.buildyouralpaca.com`; `crosswise.vercel.app` permanently redirects
  there (`next.config.js`). Its database is the primary branch of the crosswise Neon project.
- **Only a `v*` tag deploys production** (`.github/workflows/deploy.yml`, #139). A merge to `main` deploys nothing;
  each PR gets a Vercel preview. The release steps are in `CLAUDE.md`.
- A tag deploy takes a Neon snapshot branch if migrations are pending, runs `prisma migrate deploy`, deploys, and
  runs `scripts/smoke.sh` on production. If that fails, it rolls back to the previous deployment when the migrations
  are expand-only, and opens a `priority:critical` issue either way.
- The deploy's own secrets are in the GitHub `Production` environment, which only `v*` tags can use. The app's
  settings (`DATABASE_URL`, `ACCOUNT_WEBHOOK_SECRET`, …) are in the Vercel project's environment variables.
- `GET /api/health` answers 200 when the app reaches its database.
- The generator and autosave logic run entirely in user space—no background workers required.
