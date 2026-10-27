import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { previewMode } from '@/lib/preview'
import { sanitizeNextPath } from '@/lib/utils'

// The test sign-in, shown only in previews (ADR-010). Anywhere else it doesn't exist.
type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function PreviewSignInPage({ searchParams }: Props) {
  if (!previewMode()) notFound()
  const { next } = await searchParams
  const path = sanitizeNextPath(typeof next === 'string' ? next : null)

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">This is a preview</CardTitle>
          <CardDescription>
            Previews don&apos;t use the real sign-in. You use a test user, and everything you do
            here stays in this preview&apos;s own database, which holds test data only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="post" action="/api/v1/auth/preview-sign-in">
            <input type="hidden" name="next" value={path} />
            <Button type="submit" className="w-full">
              Sign in as test user
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
