import { redirectToAccounts } from '@/lib/accounts-redirect'

// Old CrossWise reset links no longer work; ask the accounts service for a new one (ADR-009).
type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  redirectToAccounts('forgot-password', (await searchParams).next)
}
