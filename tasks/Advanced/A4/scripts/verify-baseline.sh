#!/usr/bin/env bash
# Baseline smoke check for A4 starter (syntax only — no composer install required for -l).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/starter"

echo "==> PHP syntax check (starter baseline)"
while IFS= read -r -d '' file; do
  php -l "$file"
done < <(find src public -name '*.php' -print0)

echo ""
echo "OK: starter PHP files parse"
