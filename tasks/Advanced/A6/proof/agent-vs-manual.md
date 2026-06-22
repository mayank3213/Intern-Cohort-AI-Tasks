# Agent vs Manual Verification

Compares performance observations in [`perf-run-filesearch-fixture.md`](../perf-run-filesearch-fixture.md) against benchmark and behavior proof captured under `proof/`.

## Summary

| Area | Agent Output | Manual Verification | Result |
| --- | --- | --- | --- |
| Bottleneck (`array_merge` in recursion) | Dominant allocator in `fileSearch` | Fix replaces merge with foreach — [`diff-applied.patch`](diff-applied.patch) | Confirmed (code) |
| Baseline median wall time | 199.529 ms (agent run) | `./scripts/benchmark.sh` — [`benchmark-baseline.txt`](benchmark-baseline.txt): 206.413 ms | Confirmed (within run-to-run spread) |
| After-fix median | 176.355 ms (−11.6%) | Re-ran benchmark — [`benchmark-after.txt`](benchmark-after.txt): 195.288 ms (~5.4% vs captured baseline) | Partial — improvement below 10% threshold on this run |
| Output unchanged (13,650 files) | Same hash before/after | [`behavior-unchanged-tests.txt`](behavior-unchanged-tests.txt) — hash match, exit 0 | Confirmed |
| `verify-improvement.sh` | Agent: OK + ≥10% gain | Mixed captures — see Findings | Partial |
| Profiling (`array_merge` ~65–75%) | hrtime-based estimate in agent report | No separate profiler capture in `proof/` | Unverified |
| Rollback via `git restore` | Restores slow scanner | Not executed in proof session | Unverified |

---

## Findings

| Finding | Agent Detected | Manually Reproduced | Status |
| --- | --- | --- | --- |
| `array_merge` recursive bottleneck | Yes | Yes — fix targets same line in [`diff-applied.patch`](diff-applied.patch) | Confirmed |
| Baseline benchmark reproducible | Yes | Yes — 13,650 files, median 206.413 ms | Confirmed |
| ≥10% median wall-time improvement | Yes | No on captured run — 206.413 → 195.288 ms (~5.4%) | Not reproduced |
| `files_found` unchanged (13,650) | Yes | Yes — both benchmark outputs and behavior test | Confirmed |
| Output hash unchanged after fix | Yes | Yes — `verify-improvement.sh` reports hash match | Confirmed |
| `php -l` on fixed scanner | Not emphasized | Yes — syntax clean | Confirmed |
| Agent after median 176.355 ms (−11.6%) | Yes | Different machine/run — 195.288 ms on manual after run | Confirmed with variance |
| `verify-improvement-output.txt` exit 255 | N/A | One capture shows exit 255 with high fixed_median | Uncertain — inconsistent with [`behavior-unchanged-tests.txt`](behavior-unchanged-tests.txt) exit 0 |
| Rollback restores baseline timing | Yes | No | Unverified |

---

## Commands Used

```bash
cd tasks/Advanced/A6
chmod +x scripts/*.sh

# Baseline (slow scanner — before fix; captured pre-patch)
./scripts/benchmark.sh

# After applying foreach fix to fixture/FileScanner.php
./scripts/benchmark.sh

# Behavior + grader hash comparison
./scripts/verify-improvement.sh

# expected output hash check
php -r "
require 'fixture/FileScanner.php';
\$f = 'fixture/fixtures/scanner_tree';
\$a = FileScanner::fileSearch(\$f, '.php');
sort(\$a);
echo hash('sha256', implode(\"\n\", \$a));
"

# Syntax
php -l fixture/FileScanner.php
```

---

## Differences Between Agent and Manual Review

**Agent detected correctly**

- Root cause is recursive `array_merge` copying accumulated arrays; the applied fix matches the grader reference pattern (foreach append).
- Behavior verification shows identical file count and hash match against `grader/FileScanner.fixed.php`.
- Baseline workload (13,650-file tree, depth=5, breadth=4) is reproducible via `scripts/benchmark.sh`.

**Required manual confirmation**

- Baseline and post-fix benchmarks were executed and logged separately in `proof/`.
- `verify-improvement.sh` behavior check (`OK: behavior unchanged`) succeeded in [`behavior-unchanged-tests.txt`](behavior-unchanged-tests.txt).

**Could not reproduce**

- Agent-claimed **≥10%** median improvement (11.6% in agent report) was **not** achieved on the captured manual after run (~5.4% vs [`benchmark-baseline.txt`](benchmark-baseline.txt)). Benchmark variance and OS cache state may explain spread; do not claim 10% pass from proof alone.
- One [`verify-improvement-output.txt`](verify-improvement-output.txt) capture exited 255 with anomalously high `fixed_median_wall_ms` — contradicts the successful run in `behavior-unchanged-tests.txt`; treat timing proof as environment-sensitive.

**Remaining uncertainty**

- Profiling percentages in the agent report were not independently captured with a separate profiler run in `proof/`.
- Rollback timing restoration was not manually executed.
- `verify-improvement.sh` times the grader reference class, not a strict before/after comparison of the same file in one invocation.

---

## Final Confidence

**Medium confidence** — Bottleneck diagnosis, code fix, and behavior preservation are manually confirmed with captured output. **Low confidence** on the ≥10% performance gate for this specific proof session because the logged before/after medians show ~5.4% improvement, not the agent-reported 11.6%.

---

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [`benchmark-baseline.txt`](benchmark-baseline.txt) | Baseline `benchmark.sh` — median 206.413 ms |
| [`benchmark-after.txt`](benchmark-after.txt) | Post-fix `benchmark.sh` — median 195.288 ms |
| [`behavior-unchanged-tests.txt`](behavior-unchanged-tests.txt) | Hash match + `verify-improvement.sh` exit 0 |
| [`verify-improvement-output.txt`](verify-improvement-output.txt) | Alternate run — exit 255 (timing inconsistent) |
| [`diff-applied.patch`](diff-applied.patch) | foreach fix applied to `fixture/FileScanner.php` |
| [`../perf-run-filesearch-fixture.md`](../perf-run-filesearch-fixture.md) | Agent performance report |
