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

  return <>{children}</>
}
