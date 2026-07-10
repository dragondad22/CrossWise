#!/usr/bin/env bash
# scaffold-module.sh — install a staged kit module into this project.
#
# Additive scaffolding: projects start from the kit core; optional content
# ships as modules staged under bootstrap/modules/<name>/ at inception, so
# installs work offline and stay version-consistent with the kit this project
# was scaffolded from. Modules are OFFERED when their trigger fires (the
# trigger table lives in the manifest staged in bootstrap/modules/) — never
# silently applied. Installs are recorded in bootstrap/KIT_VERSION.
#
# Usage (from the project root):
#   bash ai/scripts/scaffold-module.sh list        # modules, triggers, install status
#   bash ai/scripts/scaffold-module.sh <module>    # install one module
#
# After installing a module: fill any {{TOKENS}} its files carry (see
# bootstrap/PLACEHOLDERS.md) and read its standard before working in that area.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGE="$ROOT_DIR/bootstrap/modules"
MANIFEST="$STAGE/manifest.yml"
MARKER="$ROOT_DIR/bootstrap/KIT_VERSION"

die() { echo "ABORT: $*" >&2; exit 1; }

[ -f "$MANIFEST" ] || die "no staged module manifest at bootstrap/modules/manifest.yml — was this project scaffolded by the kit engine?"

# --- manifest parsing (constrained YAML subset; portable awk, no YAML lib) ---

module_names() {
  awk '
    /^modules:/ { inmods=1; next }
    /^[^ ]/    { inmods=0 }
    inmods && /^  [A-Za-z0-9_-]+:[[:space:]]*$/ { name=$1; sub(/:$/, "", name); print name }
  ' "$MANIFEST"
}

module_trigger() { # $1 = module name
  awk -v mod="$1" '
    /^modules:/ { inmods=1; next }
    /^[^ ]/    { inmods=0 }
    inmods && /^  [A-Za-z0-9_-]+:/ { cur=$1; sub(/:$/, "", cur); next }
    inmods && cur==mod && $1=="trigger:" {
      line=$0; sub(/^[[:space:]]*trigger:[[:space:]]*/, "", line)
      sub(/[[:space:]]*#.*$/, "", line); print line
    }
  ' "$MANIFEST"
}

module_files() { # $1 = module name
  awk -v mod="$1" '
    /^modules:/ { inmods=1; next }
    /^[^ ]/    { inmods=0 }
    inmods && /^  [A-Za-z0-9_-]+:/ { cur=$1; sub(/:$/, "", cur); infiles=0; next }
    inmods && cur==mod && $1=="files:" { if ($0 !~ /\[\]/) infiles=1; next }
    inmods && cur==mod && infiles { if ($1=="-") print $2; else infiles=0 }
  ' "$MANIFEST"
}

recorded() { # $1 = module name — was the install recorded in the marker?
  [ -f "$MARKER" ] && grep -qE "^  $1: " "$MARKER"
}

# --- list mode -------------------------------------------------------------

if [ "${1:-}" = "list" ] || [ -z "${1:-}" ]; then
  echo "=== kit modules (staged in bootstrap/modules/) ==="
  module_names | while IFS= read -r m; do
    n="$(module_files "$m" | grep -c . || true)"
    if recorded "$m"; then state="installed"
    elif [ "$n" -eq 0 ]; then state="empty    "
    else state="available"
    fi
    printf '  %-12s %-10s trigger: %s\n' "$m" "$state" "$(module_trigger "$m")"
  done
  echo ""
  echo "Install: bash ai/scripts/scaffold-module.sh <module>"
  exit 0
fi

# --- install mode ----------------------------------------------------------

MOD="$1"
module_names | grep -qx "$MOD" || die "unknown module '$MOD' — run: bash ai/scripts/scaffold-module.sh list"

FILES=()
while IFS= read -r line; do
  [ -n "$line" ] && FILES+=("$line")
done < <(module_files "$MOD")
[ "${#FILES[@]}" -gt 0 ] || die "module '$MOD' ships no files yet (its content arrives in a later kit version)"

if recorded "$MOD"; then
  echo "NOTE: '$MOD' is already recorded as installed in bootstrap/KIT_VERSION — re-checking files."
fi

echo "=== installing module '$MOD' ==="
installed=0
for f in "${FILES[@]}"; do
  src="$STAGE/$MOD/$f"
  dest="$ROOT_DIR/$f"
  [ -f "$src" ] || die "staged payload missing: bootstrap/modules/$MOD/$f — restage from the kit"
  if [ -e "$dest" ]; then
    echo "  skip (already exists): $f"
  else
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    echo "  installed: $f"
    installed=$((installed + 1))
  fi
done

# Record the install in the upgrade marker (kit version + date per module).
if ! recorded "$MOD"; then
  [ -f "$MARKER" ] || printf 'kit_version: unknown\nscaffolded: unknown\nmodules:\n' > "$MARKER"
  grep -qE '^modules:' "$MARKER" || printf 'modules:\n' >> "$MARKER"
  KITVER="$(awk -F': ' '$1=="kit_version" { print $2 }' "$MARKER")"
  printf '  %s: %s %s\n' "$MOD" "${KITVER:-unknown}" "$(date +%Y-%m-%d)" >> "$MARKER"
fi

echo ""
echo "OK: module '$MOD' installed ($installed new file(s)); recorded in bootstrap/KIT_VERSION."
echo "Next: fill any {{TOKENS}} the new files carry (bootstrap/PLACEHOLDERS.md), and read the module's standard before working in that area."
