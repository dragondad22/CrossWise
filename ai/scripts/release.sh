#!/usr/bin/env bash
# release.sh — Cut a release: bump every configured version file in lockstep and
# roll CHANGELOG.md [Unreleased] into a dated version heading.
#
# Does NOT touch git — it edits files and prints the suggested commit + tag
# commands for a human to review and run.
#
# The set of version files lives in ai/scripts/version-files.txt (one path per
# line, relative to the repo root; blank lines and `#` comments ignored). The
# kit ships with just `VERSION`. The FIRST listed file is the source of truth
# for the current version. Each file is bumped according to its extension:
#   *.json          -> jq sets `.version` (regex fallback if jq is missing)
#   *.yaml / *.yml  -> `version:` line; a trailing +N build suffix is preserved
#                      and incremented (Flutter pubspec convention)
#   *               -> raw string: the whole file becomes the new version
#
# Usage:
#   ai/scripts/release.sh                          # recommend a bump from [Unreleased], then stop
#   ai/scripts/release.sh <major|minor|patch>      # bump relative to the current version
#   ai/scripts/release.sh <X.Y.Z>                  # set an explicit version
#   ai/scripts/release.sh <bump> --date YYYY-MM-DD # override the release date (default: today)
#
# Bump rubric (pre-1.0; mechanical, from which [Unreleased] subsections have entries):
#   only Fixed/Security                       -> patch
#   any Added/Changed/Deprecated/Removed      -> minor   (incl. breaking; 1.0.0 is a manual call)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHANGELOG="$ROOT_DIR/CHANGELOG.md"
VERSION_FILES_LIST="$ROOT_DIR/ai/scripts/version-files.txt"

BUMP=""
DATE="$(date +%F)"
while [ $# -gt 0 ]; do
  case "$1" in
    --date) DATE="$2"; shift 2 ;;
    -h|--help) grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) BUMP="$1"; shift ;;
  esac
done

if [ ! -f "$VERSION_FILES_LIST" ]; then
  echo "ABORT: missing $VERSION_FILES_LIST (list of version files, one per line)." >&2
  exit 1
fi
mapfile -t VERSION_FILES < <(grep -vE '^[[:space:]]*(#|$)' "$VERSION_FILES_LIST" || true)
if [ "${#VERSION_FILES[@]}" -eq 0 ]; then
  echo "ABORT: no version files configured in $VERSION_FILES_LIST." >&2
  exit 1
fi
PRIMARY_FILE="${VERSION_FILES[0]}"

# --- Recommend a bump type from the [Unreleased] section -------------------------------
# Capture the block between "## [Unreleased]" and the next "## [" heading, then see which
# subsections actually have list items.
recommend_bump() {
  [ -f "$CHANGELOG" ] || { echo "none"; return 0; }
  awk '/^## \[Unreleased\]/{f=1;next} /^## \[/{f=0} f' "$CHANGELOG" | awk '
    /^### /{ sec=$2; next }
    /^- /  { has[sec]=1 }
    END {
      if (has["Added"] || has["Changed"] || has["Deprecated"] || has["Removed"]) print "minor"
      else if (has["Fixed"] || has["Security"]) print "patch"
      else print "none"
    }'
}

RECO="$(recommend_bump)"

if [ -z "$BUMP" ]; then
  echo "=== Release bump recommendation ==="
  case "$RECO" in
    minor) echo "  Recommended: MINOR — [Unreleased] contains new features / behavior changes." ;;
    patch) echo "  Recommended: PATCH — [Unreleased] contains only fixes / security entries." ;;
    none)  echo "  [Unreleased] has no user-visible entries — nothing to release." ;;
  esac
  echo ""
  echo "  (MAJOR / 1.0.0 is never auto-recommended pre-1.0 — it is a deliberate decision.)"
  echo "  Re-run with the bump type to perform the cut, e.g.: ai/scripts/release.sh ${RECO/none/minor}"
  exit 0
fi

# --- Precondition: the configured version files must already agree ---------------------
if ! "$ROOT_DIR/ai/scripts/check-version-sync.sh" >/dev/null; then
  echo "ABORT: version files are out of sync — resolve drift before cutting a release." >&2
  "$ROOT_DIR/ai/scripts/check-version-sync.sh" || true
  exit 1
fi

# --- Read the current version from the primary (source-of-truth) file -----------------
read_version() {
  local rel="$1"
  local path="$ROOT_DIR/$rel"
  case "$rel" in
    *.json)
      if command -v jq >/dev/null 2>&1; then
        jq -r '.version // empty' "$path" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true
      else
        grep -E '"version"' "$path" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true
      fi
      ;;
    *) grep -oE '[0-9]+\.[0-9]+\.[0-9]+' "$path" | head -1 || true ;;
  esac
}

CURRENT="$(read_version "$PRIMARY_FILE")"
if [ -z "$CURRENT" ]; then
  echo "ABORT: could not read a current X.Y.Z version from $PRIMARY_FILE." >&2
  exit 1
fi
IFS='.' read -r MA MI PA <<< "$CURRENT"

case "$BUMP" in
  major) NEW="$((MA + 1)).0.0" ;;
  minor) NEW="${MA}.$((MI + 1)).0" ;;
  patch) NEW="${MA}.${MI}.$((PA + 1))" ;;
  [0-9]*.[0-9]*.[0-9]*) NEW="$BUMP" ;;
  *) echo "ABORT: invalid bump '$BUMP' (expected major|minor|patch|X.Y.Z)." >&2; exit 1 ;;
esac

if [ "$BUMP" = "major" ] || [ "${NEW%%.*}" -gt "$MA" ]; then
  echo "NOTE: this is a MAJOR bump ($CURRENT -> $NEW). Pre-1.0, MAJOR is reserved for a"
  echo "      deliberate 'API is stable' (1.0.0) decision — make sure that is intended."
fi

echo "=== Cutting release $CURRENT -> $NEW (date $DATE) ==="

# --- Bump each version file according to its extension --------------------------------
write_version() {
  local rel="$1"
  local path="$ROOT_DIR/$rel"
  case "$rel" in
    *.json)
      if command -v jq >/dev/null 2>&1; then
        local tmp="$path.tmp"
        jq --arg v "$NEW" '.version = $v' "$path" > "$tmp" && mv "$tmp" "$path"
      else
        sed -i "0,/\"version\"[[:space:]]*:[[:space:]]*\"$CURRENT\"/s//\"version\": \"$NEW\"/" "$path"
      fi
      echo "  $rel -> $NEW"
      ;;
    *.yaml|*.yml)
      # Preserve and increment a trailing +N build suffix if present (Flutter pubspec).
      local cur_build new_suffix
      cur_build="$(grep -E '^version:' "$path" | grep -oE '\+[0-9]+' | tr -d '+' | head -1 || true)"
      if [ -n "$cur_build" ]; then
        new_suffix="+$((cur_build + 1))"
        sed -i -E "s/^version:[[:space:]].*/version: ${NEW}${new_suffix}/" "$path"
        echo "  $rel -> ${NEW}${new_suffix}"
      else
        sed -i -E "s/^version:[[:space:]].*/version: ${NEW}/" "$path"
        echo "  $rel -> ${NEW}"
      fi
      ;;
    *)
      printf '%s\n' "$NEW" > "$path"
      echo "  $rel -> $NEW"
      ;;
  esac
}

echo ""
echo "Updated:"
GIT_ADD_FILES=()
for rel in "${VERSION_FILES[@]}"; do
  write_version "$rel"
  GIT_ADD_FILES+=("$rel")
done

# --- Roll CHANGELOG: fresh empty [Unreleased] above the new dated heading --------------
if [ -f "$CHANGELOG" ]; then
  awk -v ver="$NEW" -v date="$DATE" '
    !done && /^## \[Unreleased\]/ {
      print "## [Unreleased]"
      print ""
      print "## [" ver "] - " date
      done = 1
      next
    }
    { print }
  ' "$CHANGELOG" > "$CHANGELOG.tmp" && mv "$CHANGELOG.tmp" "$CHANGELOG"
  echo "  CHANGELOG.md -> [Unreleased] rolled into [$NEW] - $DATE"
  GIT_ADD_FILES+=("CHANGELOG.md")
fi

echo ""
echo "Next steps (review the diff first):"
echo "  git add ${GIT_ADD_FILES[*]}"
echo "  git commit -m 'chore(release): $NEW — <highlights>'"
echo "  git tag v$NEW   # tag the merge commit after the release PR merges"
