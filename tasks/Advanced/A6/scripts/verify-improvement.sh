#!/usr/bin/env bash
# Compare slow vs fixed scanner output hash; print fixed median if grader file present.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_DIR="$ROOT/fixture/fixtures/scanner_tree"
SLOW="$ROOT/fixture/FileScanner.php"
FIXED="$ROOT/grader/FileScanner.fixed.php"

if [[ ! -d "$FIXTURE_DIR" ]]; then
  echo "Run ./scripts/benchmark.sh first to generate fixture"
  exit 1
fi

php -r "
require '$SLOW';
require '$FIXED';
\$fixture = '$FIXTURE_DIR';
\$slow = FileScanner::fileSearch(\$fixture, '.php');
\$fixed = FileScannerFixed::fileSearch(\$fixture, '.php');
sort(\$slow);
sort(\$fixed);
\$h1 = hash('sha256', implode(\"\\n\", \$slow));
\$h2 = hash('sha256', implode(\"\\n\", \$fixed));
if (\$h1 !== \$h2 || count(\$slow) !== count(\$fixed)) {
    fwrite(STDERR, \"FAIL: output mismatch slow=\" . count(\$slow) . \" fixed=\" . count(\$fixed) . \"\\n\");
    exit(1);
}
echo \"OK: behavior unchanged (\" . count(\$slow) . \" files, hash match)\\n\";
"

echo ""
echo "==> Fixed scanner timing (5 iterations)"
php "$ROOT/fixture/bench_scanner.php" --fixture="$FIXTURE_DIR" --iterations=5 2>/dev/null | \
  php -r "
require '$FIXED';
\$fixture = '$FIXTURE_DIR';
\$times = [];
for (\$i = 0; \$i < 5; \$i++) {
    \$s = hrtime(true);
    FileScannerFixed::fileSearch(\$fixture, '.php');
    \$times[] = (hrtime(true) - \$s) / 1e6;
}
sort(\$times);
\$mid = (int) floor(count(\$times) / 2);
\$median = count(\$times) % 2 === 0 ? (\$times[\$mid-1] + \$times[\$mid]) / 2 : \$times[\$mid];
echo json_encode(['fixed_median_wall_ms' => round(\$median, 3)], JSON_PRETTY_PRINT) . \"\\n\";
"
