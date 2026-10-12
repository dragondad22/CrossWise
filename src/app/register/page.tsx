import { redirectToAccounts } from '@/lib/accounts-redirect'

// Accounts are created on the shared accounts service (ADR-009).
type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function RegisterPage({ searchParams }: Props) {
  redirectToAccounts('sign-up', (await searchParams).next)
}
