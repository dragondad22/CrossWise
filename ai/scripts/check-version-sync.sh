#!/usr/bin/env bash
# check-version-sync.sh — Verify every version-tracking file carries the same semver.
#
# The list of files lives in ai/scripts/version-files.txt (one path per line,
# relative to the repo root; blank lines and `#` comments are ignored). The kit
# ships with just `VERSION`; add package.json / pubspec.yaml / etc. as needed.
#
# Version extraction per file (by extension):
#   *.json  -> jq '.version'   (falls back to a regex if jq is missing)
#   *       -> first X.Y.Z found in the trimmed file contents
#
# Usage: ai/scripts/check-version-sync.sh
# Exits 0 when all listed files agree; non-zero (printing the drift) otherwise.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION_FILES_LIST="$ROOT_DIR/ai/scripts/version-files.txt"

if [ ! -f "$VERSION_FILES_LIST" ]; then
  echo "ABORT: missing $VERSION_FILES_LIST (list of version files, one per line)." >&2
  exit 1
fi

# Read the configured files (skip blanks / comments).
mapfile -t VERSION_FILES < <(grep -vE '^[[:space:]]*(#|$)' "$VERSION_FILES_LIST" || true)

if [ "${#VERSION_FILES[@]}" -eq 0 ]; then
  echo "ABORT: no version files configured in $VERSION_FILES_LIST." >&2
  exit 1
fi

# Extract the leading X.Y.Z semver from a file, by extension.
extract_version() {
  local rel="$1"
  local path="$ROOT_DIR/$rel"
  [ -f "$path" ] || { echo ""; return 0; }

  case "$rel" in
    *.json)
      if command -v jq >/dev/null 2>&1; then
        jq -r '.version // empty' "$path" 2>/dev/null \
          | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true
      else
        grep -E '"version"' "$path" | head -1 \
          | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true
      fi
      ;;
    *)
      grep -oE '[0-9]+\.[0-9]+\.[0-9]+' "$path" | head -1 || true
      ;;
  esac
}

echo "=== Version sync check ==="
REFERENCE=""
mismatch=0
for rel in "${VERSION_FILES[@]}"; do
  v="$(extract_version "$rel")"
  printf '  %-40s : %s\n' "$rel" "${v:-<missing>}"
  if [ -z "$REFERENCE" ]; then
    REFERENCE="$v"
  fi
  if [ -z "$v" ] || [ "$v" != "$REFERENCE" ]; then
    mismatch=1
  fi
done
echo ""

if [ "$mismatch" -eq 0 ] && [ -n "$REFERENCE" ]; then
  echo "OK: all version files carry semver $REFERENCE"
  exit 0
fi

echo "DRIFT: version files are out of sync — they must all carry the same semver." >&2
echo "Fix with a lockstep release (ai/scripts/release.sh) or correct the stray file." >&2
exit 1
