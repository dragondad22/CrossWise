# Changelog

All notable changes to CrossWise are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to SemVer.

## [Unreleased]

### Added
### Changed
- **BREAKING:** Topics are now owned per-user — an owner column is added and topic names are unique per user rather than globally. Requires a database migration plus an ownership backfill for existing data before deploy (#34).
### Fixed
- Puzzle generation is deterministic again: the same list and seed always reproduce the same puzzle, and omitting a seed now uses a stable content-derived default instead of the current time (#35)
### Security
- Enforce per-user data isolation: every topics/lists/puzzles query is scoped to the authenticated user, so a user can only read or modify their own data; non-owned resources return 404 (#34).
