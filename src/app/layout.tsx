import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'

import { lookupSession } from '@/lib/auth'
import AuthProvider from '@/components/AuthProvider'
import AppHeader from '@/components/AppHeader'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CrossWise - Study Crosswords',
  description:
    'Upload JSON lists of terms & clues to auto-generate shareable crosswords organized by topic.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await lookupSession((await headers()).get('cookie'))
    .then(({ user }) => user)
    .catch((error) => {
      // Accounts service down: render signed out rather than failing every page.
      console.error('Session lookup failed while rendering:', error)
      return null
    })

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider initialUser={initialUser}>
          <AppHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
