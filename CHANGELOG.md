# Changelog

All notable changes to CrossWise are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to SemVer.

## [Unreleased]

### Added
- Topics can now be deleted from the topics page, with a confirmation dialog that warns all lists, puzzles, and solve progress under the topic are permanently removed (#15)
- Puzzle generation now grows the grid (15→17→19) when a list doesn't fit, accepts partial puzzles instead of failing outright, and the solve screen discloses any words that didn't fit with a dismissible notice (#99)

### Fixed
- Solve progress can no longer be overwritten by a stale device or tab: saves carry a revision counter the server enforces (409 on stale writes), sync is batched instead of firing on every keystroke, and the last changes before closing the page now reliably reach the server (#84)
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
