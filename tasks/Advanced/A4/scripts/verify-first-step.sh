#!/usr/bin/env bash
# Check that a candidate first step was applied to starter/ (grader helper).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STARTER="$ROOT/starter"
FAIL=0

check() {
  if eval "$1"; then
    echo "PASS: $2"
  else
    echo "FAIL: $2"
    FAIL=1
  fi
}

echo "==> A4 first-step verification (starter/)"

check "grep -q '\"php\"' '$STARTER/composer.json'" \
  "composer.json declares php platform constraint"

check "grep -q 'vendor/' '$STARTER/.gitignore'" \
  ".gitignore ignores vendor/"

check "grep -q 'logs/' '$STARTER/.gitignore'" \
  ".gitignore ignores logs/"

check "test -f '$STARTER/.github/workflows/php-syntax.yml'" \
  "GitHub Actions php-syntax workflow exists"

if command -v php >/dev/null 2>&1; then
  echo ""
  echo "==> PHP syntax check"
  (cd "$STARTER" && while IFS= read -r -d '' file; do php -l "$file"; done < <(find src public -name '*.php' -print0))
else
  echo "WARN: php not installed — skipping syntax check"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "OK: first-step checks passed"
else
  echo "Some checks failed — see above"
  exit 1
fi
