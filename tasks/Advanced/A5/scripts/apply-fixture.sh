#!/usr/bin/env bash
# Apply agent-change.patch to a disposable copy of A4/starter (does NOT modify canonical starter).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$ROOT/../A4/starter"
PATCH="$ROOT/fixture/agent-change.patch"
SANDBOX="${A5_SANDBOX_DIR:-$ROOT/fixture/sandbox}"

if [[ ! -f "$PATCH" ]]; then
  echo "ERROR: missing $PATCH"
  exit 1
fi

rm -rf "$SANDBOX"
mkdir -p "$SANDBOX"
cp -R "$BASE/." "$SANDBOX/"

cd "$SANDBOX"
patch -p0 < "$PATCH"

echo "OK: fixture applied to sandbox: $SANDBOX"
echo "Try: cd \"$SANDBOX\" && composer install && php -S 127.0.0.1:8080 -t public"
