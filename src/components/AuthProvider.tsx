'use client'

import { useEffect, type ReactNode } from 'react'

import type { AuthUser } from '@/types/auth'
import { useAppStore } from '@/lib/store'

interface AuthProviderProps {
  children: ReactNode
  initialUser: AuthUser | null
}

export default function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const hydrateUser = useAppStore((state) => state.hydrateUser)

  useEffect(() => {
    hydrateUser(initialUser)
  }, [hydrateUser, initialUser])

  // The accounts service extends a session each day it is used, but only a
  // response to the browser can store the extended cookie. Check in once per page
  // load so someone using CrossWise daily isn't signed out 30 days after sign-in.
  const userId = initialUser?.id
  useEffect(() => {
    if (!userId) return
    fetch('/api/v1/auth/session', { cache: 'no-store' }).catch(() => {})
  }, [userId])

  return <>{children}</>
}
