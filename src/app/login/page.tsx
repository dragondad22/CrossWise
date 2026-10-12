import { redirectToAccounts } from '@/lib/accounts-redirect'

// Sign-in happens on the shared accounts service (ADR-009).
type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function LoginPage({ searchParams }: Props) {
  redirectToAccounts('sign-in', (await searchParams).next)
}
