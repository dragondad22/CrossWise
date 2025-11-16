'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAppStore } from '@/lib/store'
import { Button, buttonClasses } from '@/components/ui/button'

export default function AppHeader() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST' })
      if (!response.ok) {
        console.error('Failed to log out', await response.text())
      }
    } catch (error) {
      console.error('Failed to log out:', error)
    } finally {
      setUser(null)
      setIsLoggingOut(false)
      router.push('/')
    }
  }

  return (
    <header className="sticky inset-x-0 top-0 z-40 border-b border-border/60 bg-white/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold text-foreground transition-colors hover:text-primary"
        >
          CrossWise
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name ? user.name : user.email}
            </span>
            <Button variant="ghost" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Sign in
            </Link>
            <Link href="/register" className={buttonClasses({ className: 'text-base' })}>
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
