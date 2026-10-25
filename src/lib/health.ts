import { prisma } from '@/lib/db'

// The database half of GET /api/health (#139). Each instance asks the database at most once every
// 10 seconds, so hammering that public route can't load the database.
const CHECK_EVERY_MS = 10_000

let last: { at: number; check: Promise<boolean> } | null = null

export function databaseAnswers(): Promise<boolean> {
  if (last && Date.now() - last.at < CHECK_EVERY_MS) return last.check
  const check = prisma.$queryRaw`SELECT 1`.then(
    () => true,
    (error: unknown) => {
      console.error('Health check: the database is unreachable:', error)
      return false
    },
  )
  last = { at: Date.now(), check }
  return check
}

/** For tests: forget the last check. */
export function resetHealthCheck() {
  last = null
}
