/**
 * Email delivery seam (ADR-008).
 *
 * CrossWise has no email provider today. This module is the single, narrow
 * interface every email-sending feature must go through, so a real provider can
 * be wired in later without touching callers. Do NOT import a third-party email
 * SDK here without recording that decision (see ADR-008).
 *
 * The default implementation is a development stub:
 * - Non-production: logs the reset link to the server console so the flow can be
 *   exercised end-to-end locally. This is the only place a raw reset link may be
 *   logged, and only outside production.
 * - Production: no-ops with a warning that delivery is not configured. It never
 *   logs the recipient or the link (the link embeds the raw token).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[email] Password reset requested but no email delivery provider is configured (ADR-008); email not sent.',
    )
    return
  }

  console.info(`[email:dev-stub] Password reset link for ${to}: ${resetUrl}`)
}
