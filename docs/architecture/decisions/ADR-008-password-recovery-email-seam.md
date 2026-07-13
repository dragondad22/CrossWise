# ADR-008: Password recovery + email delivery seam

**Status:** Proposed
**Date:** 2026-07-13
**Deciders:** dragondad22
**Related ADRs:** ADR-001 (per-user data ownership — a reset token is bound to its user)

## 1. Context

CrossWise had no account-recovery path (#7): a user who forgot their password was
permanently locked out of their topics, lists, puzzles, and solve history. Recovery is
an ASVS-sensitive surface (CW-C-006): it must not enable account enumeration, tokens
must be strong, single-use, and time-limited, and a reset must invalidate existing
sessions (CLAUDE.md non-negotiable: sessions revoked server-side).

Recovery also requires delivering a reset link by email — and the repo has **no email
infrastructure at all**. Choosing a provider (Resend, SES, Postmark, …) introduces a
third-party processor of user email addresses, which matters for the privacy posture
(CW-C-002, and the Decision 1 minors posture). That choice should not be made
implicitly inside a feature PR.

## 2. Decision

**Recovery design**

- New `PasswordResetToken` table: `userId` (cascade to `users`), unique `tokenHash`,
  `expiresAt`, nullable `consumedAt`. Only a **SHA-256 hash** of the token is stored;
  the raw 32-byte (`randomBytes(32)`) token exists solely in the emailed link.
- Tokens are single-use (atomic conditional consume) and expire after **30 minutes**.
- `POST /api/v1/auth/password/forgot` returns one generic success body regardless of
  whether the email matches an account (no enumeration via status, body, or errors).
- `POST /api/v1/auth/password/reset` takes `{ token, newPassword }`; the token is the
  credential. On success the password is bcrypt-hashed via the existing `hashPassword`
  (salt rounds 12) and **all** of the user's sessions are revoked.
- Interim brute-force guard: a per-instance in-memory fixed-window limiter
  (5 requests / 15 min per client key) on both endpoints, explicitly a placeholder
  until real rate limiting lands (#89).

**Email delivery seam**

- All email sending goes through one narrow interface: `sendPasswordResetEmail(to,
  resetUrl)` in `src/lib/email.ts`. No third-party email SDK is added.
- The default implementation is a dev stub: outside production it logs the reset link
  to the server console (so the flow is testable end-to-end locally); in production it
  no-ops with a `console.warn` that delivery is not configured, and never logs the
  recipient or the link.
- Selecting a real provider is a **deferred decision**: when made, it updates this ADR
  (or supersedes it) and is surfaced to the compliance register as a new processor of
  personal data (CW-C-002).

## 3. Consequences

**Good**
- Recovery ships with the security properties fixed (hashed-at-rest, single-use,
  time-limited, enumeration-proof, sessions revoked) independent of any provider choice.
- The provider decision stays explicit and compliance-visible instead of being buried
  in a feature PR; swapping the stub for a provider touches one module.
- No raw secret at rest: a database leak does not expose usable reset links.

**Trade-offs**
- Until a provider is chosen, production users cannot actually receive reset emails —
  the endpoint behaves correctly but delivery silently no-ops (with a server warning).
  Shipping a provider is the required follow-up before recovery is usable in prod.
- The interim in-memory limiter only bounds abuse per warm serverless instance; real
  limiting is deferred to #89.
- SHA-256 (not bcrypt) for token hashing is deliberate: the input is a 256-bit random
  value, so brute-forcing the hash is infeasible and a fast hash keeps lookup O(1) by
  unique index.
