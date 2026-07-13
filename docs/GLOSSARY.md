# Glossary — CrossWise

**Audience:** a competent developer who is new to this project, its domain, and
its toolchain.

The shared AI↔human vocabulary, bidirectional by design: **Domain terms** teach
this project's language (human → AI, and to every future reader); **Technical
terms** explain the platform/standards concepts the repo depends on, in plain
English (AI → human). Explanations given in chat evaporate — this file is where
they survive.

**Recording rules** — capture inline at the moment of resolution, never as an
end-of-session batch. Record a term when any of these fires:

1. **Explained-in-chat** — a human asked, or the AI had to explain → record
   before the session ends.
2. **Coined** — a new domain noun/verb enters schema, code, or issues (an
   entity, status value, role name) → record at introduction time; confusion
   is not required (the glossary serves future readers, not just the current
   pair).
3. **Overloaded common word** — an everyday word with a repo-specific meaning →
   record the canonical qualified form, with `_Avoid_:` aliases.
4. **Load-bearing external concept** — an acronym, platform feature, or
   legal/standards concept the repo depends on → record on first doc/issue use.

Don't record general programming vocabulary at its ordinary meaning — unless
rule 1 fired.

**Authority:** this glossary is the naming reference for code, docs, and
issues. The AI challenges glossary-conflicting usage on sight; overloaded terms
get sharpened to one canonical choice instead of drifting as synonyms.

Entry format: `**Term** — plain-English definition; why it matters here when
non-obvious. _Avoid_: aliases.`

## Domain terms

<!-- Seeded by /bootstrap from the inception interview (domain answers,
non-negotiables vocabulary); grows via the recording rules. Role terms
(volunteer, admin, …) cross-link to their entry in docs/PERSONAS.md.
Example entry:
- **Animal record** — the canonical row for one animal in the shelter, the
  record of truth for its status. _Avoid_: bare "record" (ambiguous: service
  record, music record). -->

- **Topic** — the top-level organizing unit: a named group of word lists with
  optional description, color, and icon. _Avoid_: "category" (not a repo term).
- **List** — a word/term list under a Topic; the input a puzzle is generated
  from. Imported, edited, exported, and deleted as a unit. _Avoid_: bare
  "words" (ambiguous with individual entries).
- **Puzzle** — a generated crossword (grid + clues) produced from a List with a
  deterministic seed; the same List + seed always yields the same Puzzle.
- **Solve** — one user's progress state on a Puzzle (entries, timing,
  completion), autosaved locally and synced to the server. _Avoid_: "session"
  (reserved for auth sessions).
- **Autosave** — local-first persistence of Solve state; server sync reconciles
  without clobbering newer local state (a `CLAUDE.md` non-negotiable).

## Technical terms

- **ADR (Architecture Decision Record)** — a short doc recording one
  architectural decision: context, the decision, consequences, alternatives.
  Lives in `docs/architecture/decisions/`; numbered `ADR-NNN`; superseded, never
  rewritten.
- **Decision log** — the same idea for product/scope decisions, one file
  (`docs/decision-log.md`), append-only entries.
- **Epic / sub-issue** — an epic is a parent issue grouping a workstream
  (`type:epic`); its breakdown lives in native sub-issues. Milestones mean
  releases only, never epics.
- **Projects v2** — GitHub's current project boards (the table/board views with
  custom fields like Status). This repo keeps exactly one, with Status =
  Backlog / Next / In progress / Done.
- **UAT (User Acceptance Testing)** — verifying a feature against what the
  user/stakeholder actually needs, not just what the code does; acceptance
  criteria live in `docs/uat/` when the reports module is installed.
- **Beta guide** — the human-facing UAT artifact: a task-based hand-off for
  beta testers — goals, not steps (scenario, starting point, done-condition;
  never a click-path). One per feature, `BETA-<DOMAIN>-NNN-<slug>.md` in
  `docs/uat/beta/` when the reports module is installed.
- **SCA (Software Composition Analysis)** — scanning dependencies for known
  vulnerabilities (e.g. `npm audit`, `pip-audit`). One of the standing quality
  gates.
- **DPIA (Data Protection Impact Assessment)** — a documented privacy risk
  assessment required by GDPR/UK rules for high-risk processing — fires for
  this project only via the compliance trigger map (e.g. services minors use).
- **SemVer (Semantic Versioning)** — `MAJOR.MINOR.PATCH`; only Fixed/Security →
  patch, any Added/Changed → minor, breaking → major (post-1.0). Versions move
  in lockstep at release time only.
- **Conventional Commits** — commit/PR-title format `type(scope): summary`
  (`feat:`, `fix:`, `chore:`…); the squash-merged PR title becomes the commit.
- **Keep a Changelog / `[Unreleased]`** — the CHANGELOG format: entries
  accumulate under `[Unreleased]` per PR and roll into a version heading at
  release time.
- **E2E (end-to-end) test** — a test driving the real application surface (UI
  or API) through a full user flow, as opposed to unit/integration tests.
- **ERD (Entity-Relationship Diagram)** — the canonical picture of the data
  model; updated in the same PR as any schema change.
- **Runbook** — a step-by-step operational how-to (restore a backup, rotate a
  secret, find errors in logs). Lives in `docs/runbooks/`.
- **Module (kit sense)** — optional starter-kit content staged dormant under
  `bootstrap/modules/` and installed when its trigger fires (first schema file,
  first UI code, …). _Avoid_: confusing with language/package modules.
- **KIT_VERSION** — `bootstrap/KIT_VERSION`, the marker recording which
  starter-kit version scaffolded this project and which modules are installed.
- **Q-ID** — an inception/epic interview question id; short in its own file
  (`Q-ARCH-03`), always qualified in cross-references (`000/Q-ARCH-03`). See
  `ai/STANDARDS/INTERVIEW_STANDARD.md`.
- **Non-negotiables** — this project's never-re-litigate architectural
  constraints, listed in `CLAUDE.md`; changing one requires a recorded decision,
  not a conversation.
- **Feature spec** — a journey-first two-layer feature document in
  `docs/specs/` (`SPEC-<DOMAIN>-NNN`): plain-language journey on top for
  non-technical stakeholders, technical spec below for AI/devs/UAT.
  _Avoid_: "workflow doc" (the pre-v2 name).
