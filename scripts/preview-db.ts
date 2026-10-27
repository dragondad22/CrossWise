#!/usr/bin/env tsx
// Gives a preview its own database before it builds (ADR-010). scripts/vercel-build.sh runs it on a
// Vercel preview with PREVIEW_SIGN_IN=1, where DATABASE_URL is the preview Neon project, never
// production's. In order:
//   1. creates preview_<branch>_<hash> there if it isn't there yet, and notes when it was last built
//   2. drops preview databases that no build has touched for 14 days
//   3. applies the branch's migrations to it
//   4. adds the sample topics and lists for the test user (safe to run again)

import { execFileSync } from 'node:child_process'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client'
import { databaseUrl, PREVIEW_USER, previewDatabaseName, previewMode } from '../src/lib/preview'

const KEEP_DAYS = 14

async function main() {
  if (!previewMode())
    throw new Error('preview-db: not a preview with PREVIEW_SIGN_IN=1; nothing to do here')
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('preview-db: Preview has no DATABASE_URL (the preview Neon project)')
  const name = previewDatabaseName(process.env.VERCEL_GIT_COMMIT_REF)

  const admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: base }) })
  try {
    const found = await admin.$queryRawUnsafe<unknown[]>(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      name,
    )
    if (found.length === 0) {
      // The name is only [a-z0-9_] (previewDatabaseName), so quoting it is enough.
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`)
      console.log(`preview-db: created ${name}`)
    }
    await admin.$executeRawUnsafe(
      `COMMENT ON DATABASE "${name}" IS 'built ${new Date().toISOString()}'`,
    )

    const old = await admin.$queryRawUnsafe<{ datname: string; note: string | null }[]>(
      "SELECT datname, shobj_description(oid, 'pg_database') AS note FROM pg_database WHERE datname LIKE 'preview\\_%'",
    )
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
    for (const db of old) {
      const built = Date.parse(db.note?.replace(/^built /, '') ?? '')
      if (db.datname === name || !/^preview_[a-z0-9_]+$/.test(db.datname) || !(built < cutoff))
        continue
      try {
        await admin.$executeRawUnsafe(`DROP DATABASE "${db.datname}" WITH (FORCE)`)
        console.log(`preview-db: dropped ${db.datname} (${db.note})`)
      } catch (error) {
        console.warn(`preview-db: couldn't drop ${db.datname}:`, error)
      }
    }
  } finally {
    await admin.$disconnect()
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl() },
  })

  process.env.SEED_USER_ID = PREVIEW_USER.id
  process.env.SEED_USER_EMAIL = PREVIEW_USER.email
  const { seedSampleData } = await import('../src/lib/seed-data')
  await seedSampleData()
  console.log(`preview-db: ${name} is ready`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
