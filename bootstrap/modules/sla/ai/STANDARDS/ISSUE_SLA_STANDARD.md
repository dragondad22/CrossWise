*Generic standard from the Claude starter kit (sla module — scaffolded on team
formation). Replace `{{TOKENS}}`; the tokens below are filled from the
team-formation interview, not project inception.*

# Issue SLA Standard

## Purpose

Add a **timing layer** on top of the core triage rules: how fast findings get a
response, a mitigation plan, and escalation when a clock is blown. Core triage
itself — labels, severity definitions, board placement — lives in
`ai/STANDARDS/GITHUB_ISSUES.md` and does not change when this module arrives.

This standard only makes sense once there is a team with capacity to promise
against. The windows below are commitments, not aspirations — set them from the
team interview, and change them here when capacity changes.

## Tokens (filled at module scaffold time)

| Token | Meaning | Example |
|---|---|---|
| `{{SLA_BLOCKER_RESPONSE}}` | First triage response for `severity:blocker` | `4 hours` |
| `{{SLA_BLOCKER_MITIGATION}}` | Mitigation plan for `severity:blocker` | `24 hours` |
| `{{SLA_HIGH_RESPONSE}}` | First triage response for `severity:high` | `1 business day` |
| `{{SLA_HIGH_MITIGATION}}` | Mitigation plan for `severity:high` | `3 business days` |
| `{{SLA_MEDIUM_RESPONSE}}` | First triage response for `severity:medium` | `3 business days` |
| `{{SLA_MEDIUM_MITIGATION}}` | Mitigation plan for `severity:medium` | `7 business days` |
| `{{SLA_LOW_RESPONSE}}` | First triage response for `severity:low` | `5 business days` |
| `{{SLA_LOW_MITIGATION}}` | Mitigation plan for `severity:low` | `14 business days` |
| `{{SLA_ESCALATION_CONTACT}}` | Who a blown blocker clock escalates to | `project owner` |
| `{{SLA_REVIEW_FORUM}}` | Where blown non-blocker clocks are reviewed | `weekly triage review` |

## SLA by Severity

| Severity | First triage response | Mitigation plan |
|---|---|---|
| `severity:blocker` | {{SLA_BLOCKER_RESPONSE}} | {{SLA_BLOCKER_MITIGATION}} |
| `severity:high` | {{SLA_HIGH_RESPONSE}} | {{SLA_HIGH_MITIGATION}} |
| `severity:medium` | {{SLA_MEDIUM_RESPONSE}} | {{SLA_MEDIUM_MITIGATION}} |
| `severity:low` | {{SLA_LOW_RESPONSE}} | {{SLA_LOW_MITIGATION}} |

- **First triage response**: severity confirmed (or corrected), owner assigned,
  board placement done.
- **Mitigation plan**: a comment on the issue stating the fix approach and its
  target — or an explicit, dated decision to accept the risk.

## Assignment

Every finding gets an assignee (or owning-team label) within its response
window. Unassigned past the window = the clock is already blown.

## Escalation

- `severity:blocker` past either window → escalate to {{SLA_ESCALATION_CONTACT}}
  immediately; it preempts planned work.
- `severity:high` past either window → raise at {{SLA_REVIEW_FORUM}} with an
  explicit owner and a new dated target.
- Repeated blown windows at any severity → the numbers are wrong for the team's
  capacity; renegotiate them here rather than quietly ignoring them.

## See Also

- `ai/STANDARDS/GITHUB_ISSUES.md` — core triage: labels, severity definitions,
  board placement
- `ai/STANDARDS/TASK_ISSUE_STANDARD.md` — project board & lifecycle convention
