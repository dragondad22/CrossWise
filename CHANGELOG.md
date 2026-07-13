# Changelog

All notable changes to CrossWise are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to SemVer.

## [Unreleased]

### Fixed
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
