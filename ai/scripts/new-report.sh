#!/usr/bin/env bash
# new-report.sh — Scaffold a new report from a template in ai/TEMPLATES/.
#
# Usage:
#   ai/scripts/new-report.sh <type> <id> <slug>
#
#   type  one of: tester | uat | security-reviewer | performance-smoke
#                 (aliases: security, performance)
#   id    a work-item id (e.g. ISSUE-123); used in the filename and substituted
#         into the template's {{IMP_ID}} token
#   slug  short feature/workflow slug (e.g. login-rate-limit)
#
# Copies the matching template to testing-reports/<type>/<id>-<slug>.md,
# substituting {{DATE}}, {{IMP_ID}}, and {{FEATURE}} tokens. Prints the path.

set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <tester|uat|security-reviewer|performance-smoke> <id> <slug>" >&2
  exit 1
fi

TYPE_RAW="$1"
ID="$2"
SLUG="$3"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/ai/TEMPLATES"
DATE_STR="$(date +%F)"

case "$TYPE_RAW" in
  tester)                   TYPE="tester";            TEMPLATE_FILE="$TEMPLATE_DIR/TESTER_REPORT_TEMPLATE.md" ;;
  uat)                      TYPE="uat";               TEMPLATE_FILE="$TEMPLATE_DIR/UAT_REPORT_TEMPLATE.md" ;;
  security-reviewer|security) TYPE="security-reviewer"; TEMPLATE_FILE="$TEMPLATE_DIR/SECURITY_REVIEW_REPORT_TEMPLATE.md" ;;
  performance-smoke|performance) TYPE="performance-smoke"; TEMPLATE_FILE="$TEMPLATE_DIR/PERFORMANCE_SMOKE_REPORT_TEMPLATE.md" ;;
  *)
    echo "Invalid type '$TYPE_RAW'. Use tester, uat, security-reviewer, or performance-smoke." >&2
    exit 1
    ;;
esac

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "ABORT: template not found: $TEMPLATE_FILE" >&2
  exit 1
fi

OUT_DIR="$ROOT_DIR/testing-reports/$TYPE"
OUT_FILE="$OUT_DIR/${ID}-${SLUG}.md"
mkdir -p "$OUT_DIR"

cp "$TEMPLATE_FILE" "$OUT_FILE"
sed -i "s/{{DATE}}/${DATE_STR}/g" "$OUT_FILE"
sed -i "s/{{IMP_ID}}/${ID}/g" "$OUT_FILE"
sed -i "s/{{FEATURE}}/${SLUG}/g" "$OUT_FILE"

echo "$OUT_FILE"
