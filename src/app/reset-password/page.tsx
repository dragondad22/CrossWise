'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/auth/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSucceeded(true)
      } else {
        setError(result.error?.message || 'Unable to reset the password. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Password reset failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-semibold text-gray-800">
          Choose a new password
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Enter a new password for your CrossWise account.
        </p>

        {succeeded ? (
          <div role="status">
            <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Your password has been reset. Sign in with your new password to continue.
            </div>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Go to sign in
              </Link>
            </p>
          </div>
        ) : !token ? (
          <div role="alert">
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              This reset link is missing its token. Request a new link and open it directly from
              the email.
            </div>
            <p className="text-center text-sm text-gray-500">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Request a new reset link
              </Link>
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}{' '}
                <Link href="/forgot-password" className="font-medium underline">
                  Request a new link
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-blue-600 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
