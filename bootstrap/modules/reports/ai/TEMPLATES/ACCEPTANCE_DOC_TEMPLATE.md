*Generic template from the Claude starter kit — adapt to this project. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# Acceptance Doc: <{{WORK_ITEM_PREFIX}}-NNN> — <feature / change title>

<!--
WHAT: the agent-facing acceptance spec for one work item — the criteria the
change must meet, and their recorded outcomes. Required by the task-issue
completion gate ("Docs to Update"); consumed by /qa; governed by
ai/STANDARDS/UAT_SOURCE_OF_TRUTH.md (source precedence, scenario minimums,
evidence rules).

WHERE: docs/uat/UAT_{{WORK_ITEM_PREFIX}}-NNN.md — this file IS the UAT spec at
the top of the document-precedence order for its work item.

NOT THIS FILE: the human-facing beta guide (goals-not-steps hand-off for beta
testers) is a separate artifact — ai/TEMPLATES/BETA_GUIDE_TEMPLATE.md, in
docs/uat/beta/. Never blend the two audiences in one document.

RESULTS: success is silent (exit code + one summary line). A failed gate
produces a diagnostic bundle (ai/TEMPLATES/DIAGNOSTIC_BUNDLE_TEMPLATE.md) —
link it from the outcome column; do not paste failure detail here.
-->

## Sources

Precedence per `ai/STANDARDS/UAT_SOURCE_OF_TRUTH.md` — cite what governs this run:

| Source | Ref |
|---|---|
| Feature spec | <SPEC-DOMAIN-NNN, `docs/specs/`> |
| Implementation plan / work item | <{{WORK_ITEM_PREFIX}}-NNN link> |
| ADRs / decision log | <ADR-NNN, decision entry — or "none"> |

## Acceptance criteria

Criteria are explicit, written, and traceable — each cites a journey step
number or edge-case ID (EC-n) from the spec. Never invent criteria mid-run;
a spec that misses reality must fail visibly here.

| # | Criterion (observable behavior) | Source | Outcome (pass / fail / blocked) | Evidence |
|---|---|---|---|---|
| AC-1 | <what must observably happen> | <SPEC-… step 3> | <pass> | <artifact path / API snippet ref> |
| AC-2 | <…> | <EC-2> | <…> | <…> |

## Edge-case matrix

Minimum set per the standard: 3+ edge cases (invalid input, empty state,
boundary value), role/permission boundary (if applicable), navigation
resilience (refresh / back), tenant isolation (if applicable), responsive
viewports for web (375x812 / 768x1024 / 1280x800).

| # | Case | Input / precondition | Expected | Outcome | Evidence |
|---|---|---|---|---|---|
| EC-1 | <invalid input> | <…> | <…> | <…> | <…> |

## UX and accessibility critique

- Clarity: <labels, helper text, error messages actionable?>
- Friction: <unnecessary steps, ambiguous controls, confusing defaults?>
- Visual integrity: <spacing/alignment/overflow at the required viewports?>
- Accessibility basics: <keyboard navigation, visible focus, control labels, contrast check?>

## Automation

- E2E smoke: <`{{E2E_COMMAND}}` — exit code / run link>; failure artifacts
  (screenshot / trace / video) retained and linked above.

## Blockers, risks, issues

- <filed issues with links; risks accepted and by whom; BLOCKED items with the
  exact human action required — or "none">

## Self-correction log

| When | Planned path blocked | Adaptation taken |
|---|---|---|
| <…> | <…> | <alternate path / role / source reconciliation> |

## Completion gate

Per the standard — this doc is complete only when:

- [ ] Every acceptance criterion has a recorded outcome
- [ ] The edge-case matrix is fully populated
- [ ] The UX/accessibility critique is complete
- [ ] Blockers, risks, and issues are explicitly documented
- [ ] The E2E smoke ran with failure artifacts retained (or the non-web equivalent)
