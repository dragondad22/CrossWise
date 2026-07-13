'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Route } from 'next'

import { useAppStore } from '@/lib/store'

// Client-side auth gate for pages whose data requires a session (#82).
//
// Until the session finishes hydrating the caller should render its loading
// state (`isSessionPending`); once hydrated, an anonymous visitor is redirected
// to login with a `next` param pointing back at the current page — mirroring the
// solve page's behaviour instead of letting fetches 401 into a false empty state.
export function useRequireSession() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAppStore((state) => state.user)
  const sessionHydrated = useAppStore((state) => state.sessionHydrated)

  useEffect(() => {
    if (sessionHydrated && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? '/')}` as Route)
    }
  }, [sessionHydrated, user, router, pathname])

  return {
    user,
    // True while we cannot yet render data: session unknown, or redirect pending.
    isSessionPending: !sessionHydrated || !user,
    isAuthenticated: sessionHydrated && user !== null,
  }
}
