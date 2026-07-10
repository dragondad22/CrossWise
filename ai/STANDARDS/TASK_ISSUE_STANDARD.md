# Task Issue Standard

> Written assuming GitHub Issues, but the structure ports to any tracker
> (`GitHub Issues` at `https://github.com/dragondad22/CrossWise/issues`). Replace `gh` commands with
> your tracker's equivalent.

## Purpose

Define how implementation tasks are written as issues so that any AI agent (or
human) can pick one up and execute it without needing prior conversation context,
without re-investigating scope, and without making avoidable architectural
mistakes.

This standard is distinct from `ai/STANDARDS/GITHUB_ISSUES.md`, which governs
quality-agent bug reports. Task issues are for **implementing features, closing
gaps, or making deliberate changes** to the codebase.

---

## Who Creates Task Issues

- Project owner / lead — defining new work
- AI agents — breaking down large features into sub-tasks, or filing gaps
  discovered during implementation
- Quality agents — when a finding requires non-trivial new work rather than a
  simple bug fix

---

## Title Format

```
[TASK][AREA][Priority] Short imperative description
```

- `AREA`: an **area label** identifying the functional area of the codebase the
  task touches. Each project defines its own set. (example areas — set your own):
  `API` | `WEB` | `MOBILE` | `INFRA` | `AUTH` | `DOCS` | `<your-domain-area>`
- `Priority`: `Critical` | `High` | `Medium` | `Low`
- Description: imperative verb phrase, under 72 characters, e.g. "Implement audit
  log viewer API + admin UI"

Examples:
- `[TASK][MOBILE][Critical] Add HTTP client and navigation foundation`
- `[TASK][API][Critical] Implement record transfer workflow with history`
- `[TASK][DOCS][Medium] Add compliance report format distinct from general summaries`

---

## Required Labels

Labels to apply at creation:

| Label | Purpose |
|---|---|
| `task` | Identifies as an implementation task (not a bug report) |
| `area:<name>` | Functional area (example: `area:api`, `area:web`, `area:mobile`, `area:infra` — set your own) |
| `priority:critical` | Blocks real-world use or is a security/data boundary gap |
| `priority:high` | Degrades feature completeness significantly |
| `priority:medium` | Noticeable gap but workaround exists |
| `priority:low` | Polish, nice-to-have |
| `<traceability-label>` | Optional tag tying the issue to a planning artifact (e.g. a gap analysis), for traceability |

Bootstrap labels if not present (GitHub; adjust the `area:*` set to your project):
```bash
gh label create task --color 0075CA --description "Implementation task" || true
gh label create "area:api" --color BFD4F2 --description "API area" || true
gh label create "area:web" --color BFD4F2 --description "Web area" || true
gh label create "area:mobile" --color BFD4F2 --description "Mobile area" || true
gh label create "area:infra" --color BFD4F2 --description "Infrastructure area" || true
gh label create "priority:critical" --color B60205 --description "Blocks real-world use" || true
gh label create "priority:high" --color D93F0B --description "Significant completeness gap" || true
gh label create "priority:medium" --color FBCA04 --description "Workaround exists" || true
gh label create "priority:low" --color C2E0C6 --description "Polish or nice-to-have" || true
```

---

## Required Body Sections

Every task issue body must contain all sections from
`ai/TEMPLATES/TASK_ISSUE_TEMPLATE.md` in order.

### Bootstrap
The first section an AI agent reads. Lists — in order — every file the implementer
must read before touching code. Must include:
1. `ai/agent-setup.md` — always
2. `CLAUDE.md` — always
3. Any sub-area `CLAUDE.md` for each area being changed
4. Relevant standards from `ai/STANDARDS/`
5. Relevant checklists from `ai/CHECKLISTS/`
6. Key source files specific to this task

If the Bootstrap section is incomplete, the issue is not ready to implement.

### Context
2–4 sentences describing the current state, the gap, and why it matters. No
implementation details here — just the "what is broken or missing and why does it
matter."

### Governing Decisions and References
Table of every ADR, decision-log entry, workflow doc, or SOP that constrains or
informs implementation. Include the reference ID and a one-line summary of what it
governs for this task.

If no decisions govern the task, note "No existing decision — record one if
implementation reveals a choice."

### Scope — What to Build
Precise, enumerated list of what must be implemented. Include the relevant
specifics for the area, for example:
- API: exact routes (method + path), request/response shape, auth requirements
- DB: schema changes (model/table name, fields, types, relations)
- UI: page or component names, what interactions to support
- Client/mobile: screens, view models, API calls wired

Ambiguous scope = the issue is not ready to implement.

### Out of Scope
Explicit list of adjacent things that must NOT be built in this issue. Reference
deferred decisions where applicable. This prevents scope creep and protects
against an AI agent over-implementing.

### Key Files
Exact file paths (relative to repo root) the implementer must read before writing
code. Order them: data/schema first, then services, then routes, then UI. Do not
list files speculatively — only files that are directly relevant.

### Implementation Notes
Architectural constraints, gotchas, patterns to follow, and non-obvious decisions.
Things that are not in CLAUDE.md but are specific to this task. Examples:
- "State must be set atomically with the record write — follow the existing
  pattern in the relevant service"
- "Use the storage abstraction, not the cloud SDK directly — alternate backends
  must be preserved"

### Acceptance Criteria
Checkboxes. Each criterion must be independently verifiable — a reviewer should be
able to confirm each one without guesswork. Separate functional criteria from
negative-path and non-functional ones.

### Tests Required
Specific enough that the tests can be written without reading additional context.
Include:
- What service/route/component each test covers
- Happy-path scenario
- Auth / tenancy-boundary cases (required for all API changes)
- Edge cases specific to this task

### Docs to Update
Checkboxes. Every ADR, decision-log entry, or workflow/user doc that must be
created or updated as part of this task. An issue is not complete until all doc
updates are made.

### Completion Gate
Standard closing checklist. Do not modify between issues — it ensures consistency:
- `ai/CHECKLISTS/coding.md` fully checked
- All tests passing (run the project's test command in affected areas)
- `/preflight` skill passes
- `/security` skill passes (required if auth, access control, session, or a data
  boundary is touched)

---

## Issue Lifecycle

| State | Meaning |
|---|---|
| Open / Backlog | Not started |
| In Progress | Branch created, work underway |
| In Review | PR open, linked to issue |
| Done | PR merged, issue closed |

Close the issue via PR description: `Closes #<issue-number>`.

---

## Duplicate Check

Before creating a new task issue (GitHub):
```bash
gh issue list --state open --search "<short phrase> in:title"
```

---

## Relationship to Quality Issues

A quality agent finding (bug, security, perf) that requires substantial new
implementation should be converted to a task issue using this standard. The
original quality issue should be left open and linked from the task issue as
"Upstream finding: #N".

---

## See Also

- `ai/TEMPLATES/TASK_ISSUE_TEMPLATE.md` — fill-in body template
- `ai/STANDARDS/GITHUB_ISSUES.md` — quality agent bug reports
- `ai/STANDARDS/ISSUE_SLA_STANDARD.md` — SLA governance for quality board
- `ai/agent-setup.md` — full AI tooling context
