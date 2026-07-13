# [TASK][AREA][Priority] Short imperative description

## Bootstrap

Read these files in order before writing any code. Do not skip.

1. ai/agent-setup.md — tooling, scripts, CI gates, credential contract
2. CLAUDE.md — non-negotiables, architecture constraints, conventions
3. [Sub-project / module CLAUDE.md, if the repo has nested ones]
4. [Relevant standard — e.g. ai/STANDARDS/UI_STANDARD.md]
5. [Relevant standard — e.g. ai/STANDARDS/TESTING_STANDARD.md]
6. ai/CHECKLISTS/coding.md — completion gate checklist

Then read the Key Files section below before touching anything.

---

## Context

[2-4 sentences. Current state of the gap/feature. Why it matters. What is broken or missing right now.]

---

## Governing Decisions and References

| Ref | What it governs for this task |
|---|---|
| ADR-NNN | [one-line summary] |
| Decision N | [one-line summary] |
| [Workflow/spec ref] | [one-line summary] |
| docs/uat/UAT_CW-NNN.md | [one-line summary] |

If no existing decision governs this: note "No existing decision — record one if implementation reveals a choice point" and follow the decision recording process in CLAUDE.md.

---

## Standards & Compliance Impact

Run the trigger map in `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`. List any external standard or compliance obligation this task fires, and whether it's already in `docs/compliance/COMPLIANCE_REGISTER.md`.

- [ ] None — no API/UI/mobile/messaging/data-handling/minors impact, OR
- [ ] [Obligation — e.g. "adds messaging → report/block/moderation (register C-005)"; "new public endpoint → OpenAPI spec update"; "collects birthdate → minors thresholds"]

---

## Scope — What to Build

[Precise enumerated list. For each area/layer being changed. The headings below are example areas — set your own to match your stack/layout.]

### (example area — e.g. API / service)
- `METHOD /path` — [request shape, response shape, auth required, permissions]

### (example area — e.g. data model / schema)
- Model `ModelName`: add field `fieldName: Type` [constraints, relations]

### (example area — e.g. web UI)
- Page `PageName`: [what interactions to add/change]
- Component `ComponentName`: [what it renders, what props]

### (example area — e.g. mobile / client)
- Screen `ScreenName`: [state it manages, API calls, navigation]

---

## Out of Scope

[Explicit list of adjacent things NOT to build in this issue. Reference decisions where applicable.]

- [Item] — deferred per Decision N / Post-MVP
- [Item] — tracked separately in #issue-number

---

## Key Files

Read these before writing code. Listed in dependency order.

```
[path/to/data-model]        — [what to understand]
[path/to/service]           — [what to understand]
[path/to/route-or-handler]  — [what to understand]
[path/to/ui-entrypoint]     — [what to understand]
[path/to/relevant-doc]      — [what to understand]
```

---

## Implementation Notes

[Architectural constraints, patterns, gotchas specific to this task. Not in CLAUDE.md but critical to get right.]

- [Note 1 — e.g. a non-negotiable that applies here]
- [Note 2 — e.g. a shared abstraction that must be used rather than bypassed]
- [Note 3]

---

## Acceptance Criteria

### Functional
- [ ] [Verifiable behavior: given X, system does Y]
- [ ] [Verifiable behavior]

### Negative-path / Security
- [ ] [Tenant/data isolation: actor A cannot access actor B's resource]
- [ ] [Unprivileged role is rejected on protected action]
- [ ] [Auth/security boundary check specific to this task]

### Non-functional
- [ ] [Performance, accessibility, theme, or UX requirement]

---

## Tests Required

[Specific enough to write without additional context.]

### Unit
- `[unit].test` — [what scenario to cover]
- `[unit].test` — happy path: [scenario]
- `[unit].test` — boundary: [scenario]

### Integration / API
- `[integration].test` — happy path: [scenario]
- `[integration].test` — auth boundary: actor A cannot access actor B's resource
- `[integration].test` — access control: [role] is rejected on [action]

### UI / E2E (if applicable)
- `[feature].spec` — [user flow to cover]

---

## Docs to Update

- [ ] `docs/uat/UAT_CW-NNN.md` — create or update acceptance test doc
      (template: `ai/TEMPLATES/ACCEPTANCE_DOC_TEMPLATE.md`, if the reports module is installed)
- [ ] `docs/architecture/decisions/ADR-NNN.md` — [create/update if decision changed]
- [ ] `docs/decision-log.md` — [update if product/scope changed]
- [ ] [Any gap/tracking doc] — mark gap as resolved

---

## Completion Gate

Do not close or merge until all are checked.

- [ ] All items in ai/CHECKLISTS/coding.md checked
- [ ] All new and existing tests passing (`npm test`)
- [ ] /preflight skill passes
- [ ] /security skill passes (required: any auth, access-control, session, or data boundary change)
- [ ] /compliance skill passes; any fired trigger is in `docs/compliance/COMPLIANCE_REGISTER.md` (required: any API/UI/mobile/messaging/data-handling change)
- [ ] PR linked to this issue (Closes #N in PR description)
