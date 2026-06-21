#!/usr/bin/env bash
# Copy B5 into a disposable sandbox and apply the I6 seeded bug (does NOT modify canonical B5).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$ROOT/../../Basics/B5"
PATCH="$ROOT/fixture/seed-bug.patch"
SANDBOX="${I6_SANDBOX_DIR:-$ROOT/fixture/sandbox}"

if [[ ! -d "$BASE" ]]; then
  echo "ERROR: missing B5 base at $BASE"
  exit 1
fi

if [[ ! -f "$PATCH" ]]; then
  echo "ERROR: missing $PATCH"
  exit 1
fi

rm -rf "$SANDBOX"
mkdir -p "$SANDBOX"
cp -R "$BASE/." "$SANDBOX/"

cd "$SANDBOX"
patch -p0 < "$PATCH"

echo "OK: seeded bug applied to sandbox: $SANDBOX"
echo "Try: cd \"$SANDBOX\" && npm install && npm test"
