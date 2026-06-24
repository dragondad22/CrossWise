#!/usr/bin/env bash
# log-self-correction.sh — Append a structured entry to ai/self_correction_log.md.
#
# Captures reusable recovery patterns / blockers so they survive across sessions
# and roles. Creates the log with a header + template on first use.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ai/scripts/log-self-correction.sh \
    --id <WORK-ITEM-ID> \
    --role "<role, e.g. CODER|TESTER|UAT|SECURITY|PERFORMANCE>" \
    --trigger "<what caused the adaptation>" \
    --action "<what was changed/tried>" \
    --outcome "<result>" \
    [--context "<optional context>"] \
    [--reuse "<optional reusable guidance>"] \
    [--evidence "<optional file path(s)/link(s)>"] \
    [--date YYYY-MM-DD] \
    [--dry-run]

Notes:
  - --id is the work-item id (issue/ticket). --imp is accepted as an alias.
  - Appends to ai/self_correction_log.md by default.
  - Use --dry-run to print the entry without writing.
USAGE
}

DATE_STR="$(date +%F)"
ID=""
ROLE=""
CONTEXT=""
TRIGGER=""
ACTION=""
OUTCOME=""
REUSE_GUIDANCE=""
EVIDENCE=""
DRY_RUN="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --date)     DATE_STR="${2:-}"; shift 2 ;;
    --id|--imp) ID="${2:-}"; shift 2 ;;
    --role)     ROLE="${2:-}"; shift 2 ;;
    --context)  CONTEXT="${2:-}"; shift 2 ;;
    --trigger)  TRIGGER="${2:-}"; shift 2 ;;
    --action)   ACTION="${2:-}"; shift 2 ;;
    --outcome)  OUTCOME="${2:-}"; shift 2 ;;
    --reuse)    REUSE_GUIDANCE="${2:-}"; shift 2 ;;
    --evidence) EVIDENCE="${2:-}"; shift 2 ;;
    --dry-run)  DRY_RUN="true"; shift ;;
    -h|--help)  usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

if [ -z "$ID" ] || [ -z "$ROLE" ] || [ -z "$TRIGGER" ] || [ -z "$ACTION" ] || [ -z "$OUTCOME" ]; then
  echo "Missing required args."
  usage
  exit 1
fi

if ! [[ "$DATE_STR" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Invalid --date format '$DATE_STR' (expected YYYY-MM-DD)."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="$ROOT_DIR/ai/self_correction_log.md"

if [ ! -f "$LOG_FILE" ]; then
  cat > "$LOG_FILE" <<'EOF'
# Shared Self-Correction Log

Purpose: capture reusable recovery patterns and blockers across roles
(e.g. CODER, TESTER, UAT, SECURITY, PERFORMANCE).

Use this log in addition to any role-specific report `Self-Correction Log` sections.

## Entry Template

## YYYY-MM-DD — WORK-ITEM-ID — Role
- Context:
- Trigger:
- Action:
- Outcome:
- Reuse Guidance:
- Linked evidence:

---
EOF
fi

[ -n "$CONTEXT" ]        || CONTEXT="N/A"
[ -n "$REUSE_GUIDANCE" ] || REUSE_GUIDANCE="N/A"
[ -n "$EVIDENCE" ]       || EVIDENCE="N/A"

ENTRY="$(cat <<EOF
## ${DATE_STR} — ${ID} — ${ROLE}
- Context: ${CONTEXT}
- Trigger: ${TRIGGER}
- Action: ${ACTION}
- Outcome: ${OUTCOME}
- Reuse Guidance: ${REUSE_GUIDANCE}
- Linked evidence: ${EVIDENCE}

EOF
)"

if [ "$DRY_RUN" = "true" ]; then
  printf "%s" "$ENTRY"
  exit 0
fi

printf "%s" "$ENTRY" >> "$LOG_FILE"
echo "$LOG_FILE"
