#!/usr/bin/env bash
# bootstrap-labels.sh — Apply the project's issue-label taxonomy, idempotently.
#
# THE TABLE BELOW IS THE LABEL MANIFEST — the single source of truth for the
# whole taxonomy. The issue standards (ai/STANDARDS/GITHUB_ISSUES.md,
# ai/STANDARDS/TASK_ISSUE_STANDARD.md) point here instead of carrying their
# own label lists. Change labels here, re-run, done.
#
# Taxonomy (rationale in ai/STANDARDS/GITHUB_ISSUES.md):
#   type:*      kind of work item — exactly one per issue (epic/feature/task/bug)
#   area:*      functional area — PROJECT-DEFINED; edit that section at bootstrap
#   priority:*  planned work (type:epic/feature/task) — how soon it matters
#   severity:*  quality findings (type:bug) — how bad the impact is
#   flow labels quality findings only — which quality flow produced the finding
#
# Idempotent: `gh label create --force` creates the label or updates the
# color/description of an existing one. Safe to re-run any time.
#
# Usage: ai/scripts/bootstrap-labels.sh [--dry-run]
#   --dry-run  print the labels that would be applied, change nothing
#
# Requires: gh CLI, authenticated, run from the repo root (or any repo dir).
# Non-GitHub trackers: treat the table as the canonical list and mirror it
# with your tracker's label/tag tooling.

set -euo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

# label|color|description   (color = 6-hex, no leading #)
LABELS='
# --- type:* — kind, exactly one per issue ---------------------------------
type:epic|3E4B9E|Epic: parent issue grouping features/tasks via sub-issues
type:feature|A2EEEF|Feature: user-visible capability, usually under an epic
type:task|0075CA|Implementation task
type:bug|D73A4A|Defect in existing behavior

# --- area:* — PROJECT-DEFINED: replace with the functional areas of this project
area:api|BFD4F2|API routes (src/app/api)
area:web|BFD4F2|UI / React components / pages
area:db|BFD4F2|Prisma schema / data model
area:auth|BFD4F2|Auth, session, access control
area:generation|BFD4F2|Puzzle generation
area:solve|BFD4F2|Solve screen / store / autosave
area:docs|BFD4F2|Documentation
area:infra|BFD4F2|Build, CI, deploy, observability

# --- priority:* — planned work (epics/features/tasks) ---------------------
priority:critical|B60205|Blocks real-world use or is a security/data boundary gap
priority:high|D93F0B|Degrades feature completeness significantly
priority:medium|FBCA04|Noticeable gap but workaround exists
priority:low|C2E0C6|Polish or nice-to-have

# --- severity:* — quality findings (bugs) ---------------------------------
severity:blocker|B60205|Broken core flow, security boundary failure, data integrity risk
severity:high|D93F0B|Acceptance criteria failure in major workflow
severity:medium|FBCA04|Non-blocking functional defect
severity:low|C2E0C6|Copy polish, minor visual inconsistency

# --- flow labels — quality findings only: which flow produced it ----------
testing|0E8A16|Automated testing findings
uat|1D76DB|UAT findings
security-review|D93F0B|Security reviewer findings
performance|0E8A16|Performance smoke findings
flaky-test|B60205|Flaky or nondeterministic tests
coverage-gap|FBCA04|Missing critical test coverage
ux|5319E7|UX quality issue
accessibility|0052CC|Accessibility issue
documentation|006B75|Documentation drift

# --- process labels --------------------------------------------------------
evergreen|7057FF|Standards & process evergreening review (/evergreen findings)
'

if [ "$DRY_RUN" -eq 0 ]; then
  command -v gh >/dev/null 2>&1 || {
    echo "ABORT: gh CLI not found — install it or mirror the table by hand." >&2
    exit 1
  }
  gh auth status >/dev/null 2>&1 || {
    echo "ABORT: gh is not authenticated (run: gh auth login)." >&2
    exit 1
  }
fi

echo "=== Label bootstrap $([ "$DRY_RUN" -eq 1 ] && echo '(dry run)') ==="
applied=0
# while-read over a heredoc: stock macOS ships bash 3.2, which lacks mapfile.
while IFS='|' read -r name color desc; do
  # skip blanks and comment rows
  case "$name" in ''|\#*) continue ;; esac
  if [ "$DRY_RUN" -eq 1 ]; then
    printf '  %-20s #%s  %s\n' "$name" "$color" "$desc"
  else
    gh label create "$name" --color "$color" --description "$desc" --force
    printf '  applied: %s\n' "$name"
  fi
  applied=$((applied + 1))
done <<EOF
$LABELS
EOF

echo ""
echo "OK: $applied labels $([ "$DRY_RUN" -eq 1 ] && echo 'listed' || echo 'created/updated')."
