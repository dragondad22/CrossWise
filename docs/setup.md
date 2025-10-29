# Setup & Operations

## Prerequisites
- Node.js 18+ (Next.js 15 requirement)
- npm (ships with Node)
- SQLite (bundled with Prisma for local `file:` URLs) or a PostgreSQL instance for production deployments

## Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | Prisma connection string. `file:` URLs target SQLite; replace with a PostgreSQL URL for production. | `file:./dev.db` |

1. Copy/adjust `.env` as needed.
2. For PostgreSQL, use the canonical format: `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`.

## Installation
```bash
npm install
```

## Database Management
Initialise the schema locally:
```bash
npm run db:push
```

Generate Prisma client typings (runs implicitly during `db:push`, available separately):
```bash
npm run db:generate
```

Seed with demo data (topics, lists, demo user):
```bash
npm run seed
```

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
npm run dev
# Visits http://localhost:3000
```

Build for production:
```bash
npm run build
```

Run the production server locally:
```bash
npm run start
```

## Linting & Formatting
- Lint: `npm run lint`
- Format: `npm run format`

Formatting uses Prettier 3 with the Tailwind plugin.

## Authentication Defaults
- Demo account (created by seeding): `demo@crosswise.dev` / `password123`
- Sessions last 7 days (`SESSION_DURATION_MS` in `src/lib/auth.ts`). Revoke by hitting `/api/auth/logout` or clearing the `crosswise_session` cookie.

## Deployment Notes
- Vercel-friendly; ensure `DATABASE_URL` is configured for the target environment (PostgreSQL recommended).
- When switching providers, run `npx prisma migrate deploy` (or `prisma db push`) against the new database before booting the app.
- The generator and autosave logic run entirely in user space—no background workers required.
