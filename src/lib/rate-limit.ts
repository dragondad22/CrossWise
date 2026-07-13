/**
 * INTERIM in-memory fixed-window rate limiter for the password recovery
 * endpoints (#7). Deliberately cheap: per-process memory, fixed window, no
 * distributed state — on serverless it only bounds abuse per warm instance.
 *
 * #89 (real rate limiting) REPLACES this module. Do not extend it to other
 * endpoints; wire them to the #89 solution instead.
 */

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5
const MAX_TRACKED_KEYS = 10_000

interface WindowEntry {
  windowStart: number
  count: number
}

const buckets = new Map<string, WindowEntry>()

/**
 * Returns true when the request identified by `key` is allowed, false when the
 * fixed window's budget is exhausted.
 */
export function checkRateLimit(
  key: string,
  max: number = MAX_REQUESTS_PER_WINDOW,
  windowMs: number = WINDOW_MS,
): boolean {
  const now = Date.now()

  // Bound memory: drop stale windows once the map grows large.
  if (buckets.size >= MAX_TRACKED_KEYS) {
    buckets.forEach((entry, k) => {
      if (now - entry.windowStart >= windowMs) buckets.delete(k)
    })
  }

  const entry = buckets.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, count: 1 })
    return true
  }

  entry.count += 1
  return entry.count <= max
}

/** Derives a best-effort client key from proxy headers (Vercel sets x-forwarded-for). */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

/** Test-only: clears all tracked windows. */
export function __resetRateLimit() {
  buckets.clear()
}
