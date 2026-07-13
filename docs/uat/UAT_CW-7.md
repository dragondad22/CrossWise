# UAT — CW-7: Forgot Password / account recovery flow

- Work Item: CW-7 (#7)
- Feature / Workflow: Password recovery — forgot-password request + token-based reset
- Environment: local / preview

## Behavior Under Test

A user who forgot their password can request a reset link by email and use it to set
a new password. The flow must not reveal whether an email has an account, tokens must
be single-use and expire after 30 minutes (stored hashed, never plaintext), and a
successful reset must revoke every existing session for that user. Email delivery is
a dev stub until a provider is chosen (ADR-008): locally the reset link is printed to
the server console; in production delivery no-ops with a server warning.

## Acceptance Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Happy path | From `/login` click "Forgot password?", submit a registered email, open the logged reset link, enter a new password (≥8 chars), sign in with it | Generic confirmation after request; reset page shows success with a link to sign in; login works with the new password only |
| 2 | No account enumeration | Submit a registered email, then an unregistered one, to `/forgot-password` (or `POST /api/v1/auth/password/forgot`) | Identical generic response (status + body) both times; no hint whether the account exists |
| 3 | Single-use token | Complete a reset, then open the same link and try again | Second attempt fails with the generic "invalid or expired" error; password unchanged |
| 4 | Expired token | Use a reset link more than 30 minutes after requesting it | Generic "invalid or expired" error; user can request a new link |
| 5 | Forged/malformed token | Open `/reset-password?token=garbage` and submit; also `/reset-password` with no token | Generic error; no indication whether any account or token matched |
| 6 | Sessions revoked on reset | Sign in on browser A, complete a password reset from browser B, then act in browser A | Browser A's session is invalid (signed out); only the new password signs in |
| 7 | Password policy | Attempt a reset with a 7-character password | 400 / inline error citing the 8-character minimum; token not consumed |
| 8 | Hashed at rest | After a request + reset, inspect `password_reset_tokens` and `users` rows and server logs | Only `token_hash` (SHA-256) stored — raw token appears nowhere; `password_hash` is bcrypt; no plaintext password or raw token in logs (dev-stub reset link log excepted, non-production only) |
| 9 | Brute-force guard | Send 6 rapid requests to either endpoint from one client | 6th request returns 429 (interim limiter; full rate limiting tracked in #89) |
| 10 | Accessibility | Operate both forms with keyboard only | All fields labeled and focusable, visible focus, submit works via Enter; success/error states announced (role="status"/"alert") |

## Notes

- Recovery design + email delivery seam recorded in ADR-008
  (`docs/architecture/decisions/ADR-008-password-recovery-email-seam.md`).
- Token helpers live in `src/lib/auth.ts` (`createPasswordResetToken`,
  `consumePasswordResetToken`, `deleteSessionsForUser`); request shapes in
  `src/lib/validation.ts` (`ForgotPasswordSchema`, `ResetPasswordSchema`).
- Production email delivery is intentionally not configured yet — choosing a
  provider is the follow-up decision gated by ADR-008.
