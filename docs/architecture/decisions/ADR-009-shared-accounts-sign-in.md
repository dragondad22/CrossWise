# ADR-009: Use Build Your Alpaca shared accounts for sign-in

**Status:** Accepted (approved by dragondad22, 2026-10-09)
**Date:** 2026-10-09
**Deciders:** dragondad22
**Tracking:** #127
**Related ADRs:** ADR-001 (per-user ownership: unchanged, still keyed by user id), ADR-002 (expand/contract migrations), ADR-008 (superseded by this ADR)

## 1. Context

Build Your Alpaca now runs a shared sign-in service at accounts.buildyouralpaca.com (Better Auth). It offers Google, GitHub, and email + password, with confirmed email addresses, working reset email (Resend) and per-IP rate limits. Its session cookie covers every *.buildyouralpaca.com site.

CrossWise has its own email/password login. Its reset email is never sent in production (ADR-008 stub), it has only an in-memory rate limiter (#89), and the session check is copied into every route (#88). Keeping two login systems means two passwords per person and doing the security work twice.

## 2. Decision

1. **Domain.** CrossWise moves to `crosswise.buildyouralpaca.com`, and `crosswise.vercel.app` redirects there. The shared cookie only reaches buildyouralpaca.com sites.
2. **Sign-in moves out.** Sign in, sign up, password reset, sign out and account deletion happen at accounts.buildyouralpaca.com. CrossWise's login, register, forgot and reset pages redirect there with a return link.
3. **One session helper.** Every API route and the root layout get the user from `src/lib/api-auth.ts` (closes #88). It calls the accounts service's `/api/auth/get-session`, forwarding the request's cookies, with a short timeout. If the accounts service can't be reached, the helper answers 503, not 401, so the solve page keeps local progress and retries.
4. **User ids don't change.** Existing users are copied into the accounts database with their current CrossWise id, email, name (falling back to the part of the email before "@") and bcrypt hash. Nothing in CrossWise's data is rewritten. Imported emails are marked unconfirmed, so the first password sign-in sends a confirmation email. If an email already exists in the accounts database, that CrossWise user's id is changed to the accounts id; the foreign keys' ON UPDATE CASCADE carries the change.
5. **`users` stays as the anchor for topics and solves.** A row is created or updated on a user's first request (id, email, name).
   - Expand migration: `password_hash` becomes nullable.
   - Contract migration, as a later separate deploy: drop `password_hash`, `sessions` and `password_reset_tokens`.
6. **Account deletion reaches CrossWise.** When an account is deleted, the accounts service calls `POST /api/v1/internal/account-deleted` on CrossWise, signed with a shared secret (HMAC). CrossWise deletes the user row, and topics, lists, puzzles and solves cascade with it. This covers the deletion half of CW-C-003.
7. **Cutover.** Existing CrossWise sessions end, and everyone signs in once more. Solve progress saved in the browser is not affected.

## 3. Consequences

### Positive
- One account across Build Your Alpaca apps, with Google and GitHub sign-in.
- Password reset works in production.
- Real rate limits on sign-in (closes the auth part of #89).
- Account deletion reaches CrossWise data.
- CrossWise drops its bcrypt, session, reset-token and in-memory limiter code.

### Negative
- CrossWise depends on the accounts service being up. Each request makes one extra call to it, about 10-20 ms.
- A new data flow: account data lives in the shared accounts database (Neon), and account email goes through Resend. The compliance register (CW-C-002, -003, -006, -007) is updated in the same PR.
- CLAUDE.md non-negotiables on bcrypt and server-side sessions move to the accounts service and are reworded.

## 4. Alternatives Considered
- **Keep CrossWise's own login and add Google/GitHub to it.** Two login systems, and still no shared account across apps.
- **Remap every user to a new id instead of keeping ids.** More moving parts and a riskier migration, for no benefit.
- **Verify sessions locally with a shared secret instead of calling the service.** Faster, but every app would hold a secret that can forge sessions. This can be revisited later with public-key tokens if latency matters.

## 5. Implementation notes

- 2026-10-09 (#127): the production database had 0 users at cutover, so step 4's import
  did not run. The procedure is kept in the accounts service README for any app that
  moves later.
