#!/usr/bin/env bash
# Print diff stat for the agent PR fixture.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH="$ROOT/fixture/agent-change.patch"

echo "==> Agent PR fixture summary"
echo "Patch: $PATCH"
grep -E '^(\+\+\+|---|diff )' "$PATCH" | head -40
echo ""
echo "Changed files:"
grep -E '^diff ' "$PATCH" | sed 's|^diff -ruN ||; s| .*||' | sort -u
