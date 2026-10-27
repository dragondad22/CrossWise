import { prisma } from './db'
import { PREVIEW_COOKIE, previewMode, previewUser } from './preview'
import type { AuthUser } from '@/types/auth'

// Sign-in lives in the shared Build Your Alpaca accounts service (ADR-009). Its
// session cookie is set for buildyouralpaca.com, so it reaches CrossWise too; we
// ask the service who the cookie belongs to instead of keeping sessions here.

const ACCOUNTS_TIMEOUT_MS = 3000

// Only the accounts cookies are forwarded, never CrossWise's own.
const ACCOUNTS_COOKIE = /^(__Secure-)?alpaca\./

export function accountsUrl(): string {
  return process.env.ACCOUNTS_URL ?? 'https://accounts.buildyouralpaca.com'
}

/** The accounts service could not be reached or answered with an error. */
export class AuthUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthUnavailableError'
  }
}

export function accountsCookies(cookieHeader: string | null): string {
  if (!cookieHeader) return ''
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => ACCOUNTS_COOKIE.test(part.slice(0, part.indexOf('='))))
    .join('; ')
}

async function callAccounts(path: string, cookies: string, init: RequestInit = {}) {
  try {
    return await fetch(`${accountsUrl()}${path}`, {
      ...init,
      headers: { ...init.headers, cookie: cookies },
      cache: 'no-store',
      signal: AbortSignal.timeout(ACCOUNTS_TIMEOUT_MS),
    })
  } catch (error) {
    throw new AuthUnavailableError(`Accounts service unreachable (${path}): ${String(error)}`)
  }
}

type AccountsSession = {
  user?: { id: string; email: string; name?: string | null; emailVerified?: boolean }
} | null

export interface SessionLookup {
  user: AuthUser | null
  // Refreshed session cookies from the accounts service, for routes that can
  // pass them on to the browser.
  setCookies: string[]
}

/**
 * Returns the signed-in user for a request's cookies, or null. Throws
 * AuthUnavailableError when the accounts service is down, so callers can answer
 * 503 instead of treating the user as signed out.
 */
export async function lookupSession(cookieHeader: string | null): Promise<SessionLookup> {
  // A preview never asks the accounts service (ADR-010).
  if (previewMode()) {
    const user = previewUser(cookieHeader)
    if (user) await ensureLocalUser(user, { emailVerified: true })
    return { user, setCookies: [] }
  }

  const cookies = accountsCookies(cookieHeader)
  if (!cookies) return { user: null, setCookies: [] }

  const response = await callAccounts('/api/auth/get-session', cookies)
  if (!response.ok) {
    throw new AuthUnavailableError(`Accounts service answered ${response.status}`)
  }

  const body = (await response.json()) as AccountsSession
  if (!body?.user) return { user: null, setCookies: response.headers.getSetCookie() }

  const user: AuthUser = {
    id: body.user.id,
    email: body.user.email,
    name: body.user.name || null,
  }
  await ensureLocalUser(user, { emailVerified: body.user.emailVerified === true })
  return { user, setCookies: response.headers.getSetCookie() }
}

/** Ends the accounts session and returns the cookie-clearing headers. */
export async function signOutOfAccounts(cookieHeader: string | null): Promise<string[]> {
  if (previewMode())
    return [`${PREVIEW_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`]
  const cookies = accountsCookies(cookieHeader)
  if (!cookies) return []
  const response = await callAccounts('/api/auth/sign-out', cookies, {
    method: 'POST',
    // The accounts service only accepts sign-outs from its listed app origins.
    headers: { 'content-type': 'application/json', origin: appUrl() },
    body: '{}',
  })
  return response.headers.getSetCookie()
}

/** CrossWise's own public origin, where the accounts service sends people back to. */
export function appUrl(): string {
  return process.env.APP_URL ?? 'https://crosswise.buildyouralpaca.com'
}

// Topics and solves reference users.id, so every signed-in user needs a local
// row. Remember which rows are current to skip the write on most requests.
const knownUsers = new Map<string, string>()

export async function ensureLocalUser(user: AuthUser, { emailVerified = false } = {}) {
  const fingerprint = `${user.email}\n${user.name ?? ''}`
  if (knownUsers.get(user.id) === fingerprint) return

  // Someone with a CrossWise account from before shared sign-in has a row under
  // their old id (#134). ADR-009: give that row the accounts id, and the foreign
  // keys' ON UPDATE CASCADE carries their topics and solves along. Only for a
  // verified email, so nobody claims data by signing up with someone else's.
  const existing = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
  if (existing && existing.id !== user.id) {
    if (!emailVerified) {
      throw new Error(`users row for ${user.id} blocked by an older row with an unverified email`)
    }
    // updateMany, so a parallel request that already moved the row is a no-op.
    await prisma.user.updateMany({ where: { id: existing.id }, data: { id: user.id } })
    console.info(`Moved CrossWise user ${existing.id} to accounts id ${user.id}`)
  }

  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email, name: user.name ?? null },
    update: { email: user.email, name: user.name ?? null },
  })
  knownUsers.set(user.id, fingerprint)
}

export function __resetKnownUsers() {
  knownUsers.clear()
}
