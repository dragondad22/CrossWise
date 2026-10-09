import { redirectToAccounts } from '@/lib/accounts-redirect'

// Account settings, sign-in methods and deletion live on the shared accounts service.
type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function AccountPage({ searchParams }: Props) {
  redirectToAccounts('', (await searchParams).next)
}
