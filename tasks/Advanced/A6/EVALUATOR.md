# A6 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Fixture

| Field | Value |
|-------|-------|
| Task root | `tasks/Advanced/A6` |
| Bottleneck file | `fixture/FileScanner.php` |
| Workload | `fixture/fixtures/scanner_tree` (default depth=5, breadth=4, files_per_dir=10) |
| Golden reference | `perf-run-scanner-filesearch.md` (reSlim, ~10.8% improvement) |

## Root cause

Recursive **`array_merge($files, self::fileSearch(...))`** at each directory node copies the entire accumulated array — **O(n²)** aggregate copying on large trees.

**Evidence lines:** `fixture/FileScanner.php` — `array_merge` inside `fileSearch` loop over subdirectories.

## Expected fix

Replace:

```php
$files = array_merge($files, self::fileSearch($path, $extension));
```

With:

```php
foreach (self::fileSearch($path, $extension) as $childFile) {
    $files[] = $childFile;
}
```

Reference implementation: `grader/FileScanner.fixed.php` (for graders only).

## Benchmark commands

```bash
cd tasks/Advanced/A6
chmod +x scripts/*.sh
./scripts/benchmark.sh                    # baseline (slow)
# after candidate fixes FileScanner.php:
./scripts/benchmark.sh                    # should show ≥10% lower median_wall_ms
./scripts/verify-improvement.sh         # hash + fixed timing (graders)
```

## Pass criteria

- [ ] Baseline median documented (expect **~150–250 ms** on typical laptop for full tree; varies by PHP/CPU)
- [ ] Profile or reasoning identifies **`array_merge`** as dominant cost
- [ ] Fix is append-via-foreach (or equivalent zero-copy merge), not unrelated optimization
- [ ] **≥10%** median wall time improvement vs baseline on **same** depth/breadth/files settings
- [ ] `files_found` and output hash unchanged
- [ ] ≤3 files changed; scanner change ≤25 lines preferred
- [ ] Rollback documented

## Behavior verification

```bash
php -r "
require 'fixture/FileScanner.php';
\$f = 'fixture/fixtures/scanner_tree';
\$a = FileScanner::fileSearch(\$f, '.php');
sort(\$a);
echo hash('sha256', implode(\"\n\", \$a));
"
```

Same hash before/after fix.

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| Improvement <10% | Tree too small — use default 5/4/10 or run more iterations |
| Different file count after fix | Changed matching logic or traversal order |
| Candidate “fixed” without numbers | Reject — baseline/after mandatory |
| Used sort/glob instead of fixing merge | Wrong bottleneck — profile shows array_merge |

## Optional grader check

```bash
./scripts/verify-improvement.sh
# Expect: OK behavior unchanged + fixed_median_wall_ms lower than baseline
```

## Out of scope

- Rewriting scanner to use `RecursiveDirectoryIterator` only (unless same output + profile proof)
- Caching results without demonstrating merge fix
- Parallelism / external tools
