*Generic standard from the Claude starter kit — adapt to this project's stack. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# UAT Source of Truth Standard

## Purpose
Ensure UAT (user-acceptance testing) decisions are based on authoritative documents
and observable behavior, not assumptions. When two sources disagree, there must be a
single, predictable rule for which one wins.

## Two Artifacts, Two Audiences

UAT produces two distinct artifacts — never blended into one document:

1. **Acceptance verification** (agent-facing) — the acceptance doc for a work
   item: `docs/uat/UAT_{{WORK_ITEM_PREFIX}}-NNN.md`, template
   `ai/TEMPLATES/ACCEPTANCE_DOC_TEMPLATE.md`. Explicit criteria, edge-case
   matrix, evidence — everything scripted and repeatable belongs here, executed
   via `{{E2E_COMMAND}}`. The rest of this standard governs this artifact.
2. **Beta guides** (human-facing) — task-based hand-offs for beta testers:
   `docs/uat/beta/BETA-<DOMAIN>-NNN-<slug>.md` (ID mirrors the feature spec),
   template `ai/TEMPLATES/BETA_GUIDE_TEMPLATE.md`. **Goals, not steps** — each
   task is a scenario, a starting point, and a done-condition, never a
   click-path. Human testers are reserved for what automation can't observe
   (naïve use, comprehension, discoverability); a step-by-step script destroys
   exactly that.

Beta-guide lifecycle:

- **Derived, not invented:** one guide per feature, generated from the feature
  spec's journey layer (the journey with the steps deleted), addressed to a
  persona by name. It is user-facing text — the audience-first rules apply
  (`ai/STANDARDS/DOCUMENTATION_STANDARD.md`).
- **Drafted at feature-complete, human-reviewed** before any tester sees it;
  refreshed at release time — the CHANGELOG's Unreleased section is the delta
  of guides to create or update for a beta round.
- **Sequencing:** testers receive guides only after acceptance verification and
  the E2E smoke are green on a build they can reach. A tester's naïve first
  pass through a flow is nonrenewable — never spend it on failures automation
  would have caught.
- **Feedback routing:** a tester asking *how* to do something is a design
  finding, not a documentation request — route per the "how do I…?" rule in
  `ai/STANDARDS/UI_STANDARD.md` (ui module). Bugs go through
  `ai/STANDARDS/GITHUB_ISSUES.md`.

## Document Precedence
When documents conflict, resolve in this order (top wins). Adapt the paths to where
these artifacts live in this project:

1. The UAT spec for the work item: `{{UAT_DOC}}` (e.g.
   `docs/uat/UAT_{{WORK_ITEM_PREFIX}}-<ID>_*.md`).
2. The implementation plan for the matching work item.
3. The relevant feature spec(s) in `docs/specs/`.
4. ADRs and the product decision log.

If conflict remains unresolved:
- Follow the higher-precedence source.
- Document the conflict in the UAT report.
- Open a docs issue tagged `uat` + `documentation`.

## Acceptance Criteria Discipline
- Acceptance criteria must be **explicit, written, and traceable to a source above** —
  do not invent acceptance criteria from conversation or memory during the UAT run.
- When a feature spec exists, criteria cite its journey step numbers and edge-case IDs
  (EC-n) — a spec that misses reality must fail visibly here, not silently.
- Each criterion gets a recorded outcome (pass / fail / blocked) — no criterion is
  left unaddressed.
- A feature is not "accepted" because it appears to work; it is accepted when every
  stated criterion is verified against observable behavior.

## Required Scenario Set (Minimum)
For each feature/workflow tested, cover:
- Happy-path flow completion.
- At least 3 edge cases (invalid input, empty state, boundary value).
- Role/permission boundary behavior (when applicable).
- Navigation resilience (refresh / back).
- Tenant/data-isolation expectation (for multi-tenant-sensitive flows, if applicable).
- Responsive UI checks (web): 375x812 (mobile), 768x1024 (tablet), 1280x800 (desktop).

## UX and Accessibility Baseline
UAT must include:
- **Clarity:** labels, helper text, and error messages are actionable.
- **Friction:** unnecessary steps, ambiguous controls, confusing defaults.
- **Visual integrity:** spacing/alignment/overflow at the required viewports.
- **Accessibility basics:** keyboard navigation without traps, visible focus
  indicators, clear form-control labels, a basic contrast check in browser tooling.

## Evidence Requirements
Each acceptance result must include at least one of:
- a screenshot path,
- a short video path (optional),
- a console/network note,
- an API response snippet for backend-observable behavior.

Store artifacts under a dated, per-run directory, e.g.:
- `testing-reports/artifacts/<date>_<work-item>_<feature>_<timestamp>/`

## Default Test Automation (Web UAT)
- Web UAT runs should execute the project's E2E smoke by default: `{{E2E_COMMAND}}`.
- The E2E configuration must retain failure artifacts:
  - screenshot on failure,
  - trace on failure,
  - video on failure.
- Failure artifacts must be linked in the UAT report appendices.
- For non-web targets, substitute the project's equivalent automated check
  (`{{TEST_COMMAND}}`) and the same "keep failure evidence" rule.

## Self-Correction Protocol
If the planned UAT path is blocked:
1. Try an alternate equivalent path (e.g. API-first verification + UI confirmation).
2. Try an alternate role/test account if role data is corrupted.
3. Reconcile behavior against the source-precedence list above.
4. Record the adaptation in a `Self-Correction Log`.
5. If still blocked, mark `BLOCKED` with the exact human action required.

## Completion Gate
UAT is complete only when:
- The acceptance-criteria table is fully populated with outcomes.
- The edge-case matrix is populated with outcomes.
- The UX/accessibility critique is complete.
- Blockers, risks, and issues are explicitly documented.
