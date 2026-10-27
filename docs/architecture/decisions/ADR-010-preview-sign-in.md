# ADR-010: Previews sign in as a test user, on a database of their own

**Status:** Accepted (approved by dragondad22, 2026-10-27, approval #523)
**Date:** 2026-10-27
**Deciders:** dragondad22
**Tracking:** #143
**Related ADRs:** ADR-009 (shared sign-in: unchanged for production and local runs), ADR-002 (migrations)

## 1. Context

Checking a change took two terminals: the accounts service on port 3100 and CrossWise on 3001. Vercel already
builds a preview for every PR, behind the owner's Vercel login, but it was no use: almost every page needs
sign-in, and signing in sent you to production.

A preview can't use the shared sign-in:
- Its cookie is set for `buildyouralpaca.com` (ADR-009). Previews live on `*.vercel.app`, and browsers never share
  a cookie between two vercel.app sites (it's on the Public Suffix List).
- The accounts service is production. Any session it gives out is real, and a preview runs unreviewed PR code.
- Previews and local runs never use production data or credentials.

The other options looked at: local dev with one command starting the accounts service too (still a checkout
and a terminal per check), and local dev against the hosted sign-in (a real session in code under test). Real
sign-in on previews needs each preview on a buildyouralpaca.com name, which hands it the real cookie, and
costs Vercel Pro plus a $100/month add-on.

## 2. Decision

1. **Test sign-in.** On a Vercel preview with `PREVIEW_SIGN_IN=1`, CrossWise never calls the accounts service.
   `/login`, `/register`, `/account` and the password pages go to `/preview-sign-in`, whose button signs you
   in as one test user (`preview-test-user`) with a CrossWise cookie, `crosswise_preview_user`. Sign-out clears
   it. A real accounts cookie is never read or passed on.
2. **Only in previews.** It's on only when `VERCEL_ENV` is `preview` and `PREVIEW_SIGN_IN` is `1`
   (`src/lib/preview.ts`). `PREVIEW_SIGN_IN` is set in Vercel for Preview only. Anywhere else,
   `/preview-sign-in` and `POST /api/v1/auth/preview-sign-in` answer 404, and `scripts/smoke.sh` checks that on
   production after every release.
3. **Its own database.** Preview's `DATABASE_URL` points at a separate Neon project, `crosswise-preview`, with
   test data only. It is not a branch of the production project, because Neon branches keep their parent's
   passwords. Each branch gets its own database there, `preview_<branch>_<hash>`, so PRs with migrations don't
   affect each other.
4. **Built by Vercel's build.** `vercel.json` runs `scripts/vercel-build.sh`. On a preview with the test
   sign-in on, it first runs `scripts/preview-db.ts`: drop preview databases no build has touched for 14 days,
   create the branch's database if needed, apply the branch's migrations, and add the sample topics and lists
   for the test user. A lock on the preview project lets only one build do this at a time. Production builds
   only build; its migrations stay in `deploy.yml`.
5. **Nothing from production in Preview.** Preview variables reach PR code, so Vercel's Preview environment
   holds only `DATABASE_URL` (the preview project) and `PREVIEW_SIGN_IN=1`.

## 3. Consequences

### Positive
- Checking a change: open the preview link on the PR, from any device, and tap "Sign in as test user". No
  checkout, no terminal.
- Works for every PR, including the dark factory's.
- No change to the accounts service.

### Negative
- Previews don't check the real sign-in. A change to CrossWise's sign-in code (risky tier in `factory.toml`) is
  checked locally with the accounts service before release (`docs/setup.md`, "Local Sign-in").
- Production code carries the test sign-in, switched off. Two settings, Vercel's own `VERCEL_ENV` and a
  Preview-only variable, plus the release smoke test, keep it off.
- Preview databases share one Neon project on the free plan (0.5 GB). The 14-day clean-up keeps it small; a
  preview older than that needs a redeploy to get its database back.

## 4. Alternatives Considered
- **Local, one command** (`npm run dev:all` with the accounts service in Docker). Real sign-in, but every check
  needs a checkout and a terminal, and the accounts repo is private, so the factory's boxes can't use it.
- **Local against the hosted sign-in.** Hands a real session to code under test; a safe version needs a second,
  non-production accounts service, its own subdomain and cookie name, HTTPS and a hosts entry.
- **Previews on buildyouralpaca.com names.** Gives unreviewed PR code the real sign-in cookie; per-PR names need
  Vercel Pro plus a paid add-on and Vercel's nameservers.
- **One shared preview database.** One PR's migrations would break other PRs' previews.
- **A branch per preview with Neon's Vercel integration.** It branches from the linked project's default branch
  and also sets Production's `DATABASE_URL`, so it would either copy production data or overwrite production's
  setting.
