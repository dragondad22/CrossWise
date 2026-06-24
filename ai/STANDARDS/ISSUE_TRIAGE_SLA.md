# Quality Triage Board and SLA Standard

## Purpose
Define a single triage model for TESTER, UAT, SECURITY REVIEWER, and PERFORMANCE
SMOKE findings.

## Shared Board Model
Use one shared board in `https://github.com/dragondad22/CrossWise/issues`, e.g. named
`CrossWise Quality Triage`.

Required columns (example defaults — rename to your tracker's conventions):
1. `New`
2. `Confirmed`
3. `In Progress`
4. `Ready for Verify`
5. `Closed`

## SLA by Severity
(Recommended defaults — tune to your team's capacity.)
- `Blocker`: first triage response within 4 hours, mitigation plan within 24 hours
- `High`: first triage response within 1 business day, mitigation plan within 3 business days
- `Medium`: first triage response within 3 business days, mitigation plan within 7 business days
- `Low`: first triage response within 5 business days, mitigation plan within 14 business days

## Required Labels
(Example defaults — keep in sync with `ai/STANDARDS/GITHUB_ISSUES.md`.)
- Flow labels: `testing`, `uat`, `security-review`, `performance`
- Severity labels: `severity:blocker`, `severity:high`, `severity:medium`, `severity:low`

## Assignment Rules
- Every new quality issue must include a severity label.
- Every new quality issue must include at least one flow label.
- Every new quality issue must have an assignee or owning-team label within the
  SLA response window.

## Operational Commands
- Generate an SLA status snapshot with the kit's triage SLA report script (e.g.
  `ai/scripts/triage-sla-report.sh`), or your tracker's reporting equivalent.

## Escalation
- Any `Blocker` exceeding SLA must be escalated immediately to the project owner.
- Any `High` exceeding SLA must be reviewed at the next standup with an explicit
  owner.
