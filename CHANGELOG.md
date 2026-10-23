# Changelog

All notable changes to CrossWise are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to SemVer.

## [Unreleased]

### Changed
- **BREAKING:** CrossWise now uses the shared Build Your Alpaca account at accounts.buildyouralpaca.com. Sign in with Google, GitHub, or email and password; the same account works in every Build Your Alpaca app. Everyone signs in once more after this release. CrossWise moves to crosswise.buildyouralpaca.com, and the old crosswise.vercel.app address redirects there (#127)
- Password reset now actually sends an email, and sign-in is rate limited, both handled by the accounts service (#127)
- Length limits on clues, names and the topic icon now count most emoji as one character instead of two (#144)
- If the accounts service is briefly unreachable, CrossWise answers "try again shortly" instead of signing you out, and keeps your local solve progress (#127)

### Added
- Deleting your account at accounts.buildyouralpaca.com now also deletes your CrossWise topics, lists, puzzles and solve progress (#127)

### Fixed
- Signing in with an account you had before the switch no longer loops between CrossWise and the sign-in page; your topics, lists and solves stay with you (#134)

### Security
- Upgraded to Next.js 16 and Prisma 7, fixing a remote-code-execution flaw in image optimization and a page cache-poisoning flaw; the production dependency scan is clean again (#129)
- Upgraded Next.js to 16.4.2 and zod to 4.6.7, fixing two remote-code-execution flaws and a denial-of-service flaw in Next.js and a memory-exhaustion flaw in input validation (#144)

## [0.2.0] - 2026-07-13

### Added
- Forgot-password account recovery: request a reset link from the login page and set a new password via a single-use, 30-minute emailed token; all sessions are revoked on reset (email delivery is a dev stub until a provider is chosen, ADR-008) (#7)
- Starting a new game now opens a puzzle-size chooser: pick 10–50 words or the whole list, and "New puzzle" on the solve screen regenerates at the same size (#22)
- Topics can now be deleted from the topics page, with a confirmation dialog that warns all lists, puzzles, and solve progress under the topic are permanently removed (#15)
- The clue panel gained progress-aware Across/Down tabs with solved counts, preset filters (Unsolved, Flagged, Errors) that compose with search, and per-clue flags that persist with your solve progress (#13)
- Puzzle generation now grows the grid (15→17→19) when a list doesn't fit, accepts partial puzzles instead of failing outright, and the solve screen discloses any words that didn't fit with a dismissible notice (#99)

### Changed
- Generating a new puzzle now shows a contextual overlay over the grid (with the list name and an accessible progress announcement) instead of replacing the whole screen with a spinner (#14)
- The solve grid now shows a two-layer highlight — a soft band across the selected clue and a stronger accent plus ring on the active cell — with an accessible high-contrast focus ring, replacing the single hard-coded yellow highlight (#12)

### Fixed
- The Export action on a list now produces a blank printable crossword (empty numbered grid plus across/down clues, no answers) built from the list's most recent puzzle, instead of downloading raw list JSON; lists without a generated puzzle get a friendly prompt to generate one first (#2)
- Solve progress can no longer be overwritten by a stale device or tab: saves carry a revision counter the server enforces (409 on stale writes), sync is batched instead of firing on every keystroke, and the last changes before closing the page now reliably reach the server (#84)
- Delete-list confirmation is now fully keyboard-accessible: Escape cancels, focus lands on the safe Cancel action, and the dialog is announced to assistive tech (#16)
- Failed loads on the topics, lists, and solve screens now show a visible, dismissible error with a retry action instead of a blank or silently-empty page; the solve screen's loading state also updates reactively (#36)
- Importing a list with an answer containing characters outside A–Z (accents, digits, hyphens, spaces) now fails with an error naming the word, instead of silently stripping characters and corrupting the list (#17)
- Visiting your topics or lists while signed out now redirects to login (and back after signing in) instead of showing a false "No topics yet" screen; the topics page also gained a proper loading state (#82)
- Puzzle generation is now independent of database row order: the same list and seed reproduce the same puzzle even after rows are updated or reordered (#77)
- Puzzle generation no longer places the same word twice or reports success for puzzles that silently dropped most of the list; placement counts and the success threshold now reflect the real grid (#76)

### Security
- Login and register pages reject protocol-relative `next` redirect targets (`//evil.com`), closing an open-redirect phishing vector (#78)

## [0.1.0] - 2026-07-10

First tracked release. Covers all functionality shipped to date — topics, word
lists (import/export), seeded crossword generation, the solve UI with local
autosave + server sync, and user accounts — plus the entries below, which record
changes made after the changelog was introduced. Versioning starts at 0.1.0 by
decision (see `docs/decision-log.md`, Decision 3); earlier history is untagged.

### Added
### Changed
- **BREAKING:** Topics are now owned per-user — an owner column is added and topic names are unique per user rather than globally. Requires a database migration plus an ownership backfill for existing data before deploy (#34).
### Fixed
- Puzzle generation is deterministic again: the same list and seed always reproduce the same puzzle, and omitting a seed now uses a stable content-derived default instead of the current time (#35)
### Security
- Enforce per-user data isolation: every topics/lists/puzzles query is scoped to the authenticated user, so a user can only read or modify their own data; non-owned resources return 404 (#34).
