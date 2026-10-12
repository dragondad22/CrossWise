import { redirectToAccounts } from '@/lib/accounts-redirect'

// Password resets happen on the shared accounts service (ADR-009).
type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function ForgotPasswordPage({ searchParams }: Props) {
  redirectToAccounts('forgot-password', (await searchParams).next)
}
