import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'

import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'
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
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = sessionToken ? await getSessionForToken(sessionToken) : null
  const initialUser = session?.user ?? null

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
