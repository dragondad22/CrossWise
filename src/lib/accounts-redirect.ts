import type { Route } from 'next'
import { redirect } from 'next/navigation'

import { accountsUrl, appUrl } from './auth'
import { previewMode } from './preview'
import { sanitizeNextPath } from './utils'

type AccountsPage = '' | 'sign-in' | 'sign-up' | 'forgot-password'

/** Sends the browser to a page on the accounts service, which returns it to `next`. */
export function redirectToAccounts(page: AccountsPage, next?: string | string[]): never {
  // A preview has no accounts service, only the test sign-in (ADR-010).
  if (previewMode()) {
    const path = sanitizeNextPath(typeof next === 'string' ? next : null)
    redirect(`/preview-sign-in?next=${encodeURIComponent(path)}` as Route)
  }
  const back = `${appUrl()}${sanitizeNextPath(typeof next === 'string' ? next : null)}`
  // An external URL, so typed routes can't check it.
  redirect(`${accountsUrl()}/${page}?redirect=${encodeURIComponent(back)}` as Route)
}
