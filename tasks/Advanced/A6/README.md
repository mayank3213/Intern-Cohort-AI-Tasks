# A6 — Performance Profiling + Targeted Fix (90 min)

Find a **real performance bottleneck** in the A6 file scanner fixture, profile it with evidence, apply **one minimal fix**, and prove **≥10% improvement** with before/after numbers while keeping behavior unchanged.

## Target

**Fixture:** [`fixture/FileScanner.php`](fixture/FileScanner.php) — recursive directory scan with an intentional **O(n²) `array_merge` pattern** (same class of bug as reSlim `Scanner::fileSearch`).

Do **not** read [`grader/`](grader/) until after your run.

## Deliverables

Submit one markdown report with:

1. **Baseline measurement** — method, environment, iterations, median wall time (ms)
2. **Profiling approach** — tool used and top frames / what dominated time
3. **Bottleneck analysis** — root cause with `source: FileScanner.php:line`
4. **Code change** — minimal diff (≤3 files, ≤25 lines in scanner preferred)
5. **After measurement** — same workload, median ms, **improvement %**
6. **Behavior verification** — file count + output hash unchanged
7. **Rollback** — how to revert

## Time box

| Phase | Minutes |
|-------|---------|
| Baseline + benchmark | 20 |
| Profile + analysis | 25 |
| Implement fix + re-measure | 30 |
| Verify + document | 15 |

## Quick start

```bash
cd tasks/Advanced/A6
chmod +x scripts/*.sh

# Generate tree + baseline (first run creates ~13k-file fixture — may take a minute)
./scripts/benchmark.sh

# Smaller tree for iteration (optional)
BENCH_DEPTH=3 BENCH_BREADTH=3 BENCH_FILES_PER_DIR=5 ./scripts/benchmark.sh
```

Example baseline output:

```json
{
  "files_found": 13650,
  "median_wall_ms": 200.716,
  "median_throughput_files_per_sec": 68006.6
}
```

## Profiling hints

- Run `./scripts/benchmark.sh` first for numbers — **never optimize without baseline**
- PHP: `XDEBUG_MODE=profile php fixture/bench_scanner.php --profile --fixture=...`
- Look for **`array_merge`** consuming most wall time on large trees
- Hot path: recursive directory walk in `FileScanner::fileSearch`

## Suggested fix direction (discover yourself)

Replace recursive **`array_merge($files, child...)`** with appending child paths via **`foreach` + `$files[]`**. Do not change return order or matching rules.

## Pass criteria

- [ ] Baseline documented with median ms and file count
- [ ] Profile evidence ties bottleneck to specific lines
- [ ] One focused change mapped to profile (no drive-by refactors)
- [ ] After median ≥ **10% lower** than baseline on same fixture settings
- [ ] Same files found (count + hash) before and after
- [ ] Rollback steps included

## Layout

```
A6/
├── README.md
├── fixture/
│   ├── FileScanner.php       # slow baseline (you profile & fix this)
│   ├── generate_fixture.php
│   ├── bench_scanner.php
│   └── fixtures/             # generated tree (gitignored)
├── grader/                   # reference fix — do not read during exercise
│   └── FileScanner.fixed.php
├── scripts/
│   ├── benchmark.sh          # before numbers
│   └── verify-improvement.sh # grader helper
├── targeted-perf-fixer.md
└── perf-run-scanner-filesearch.md   # golden sample (reSlim)
```

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `BENCH_DEPTH` | 5 | Directory depth |
| `BENCH_BREADTH` | 4 | Subdirs per level |
| `BENCH_FILES_PER_DIR` | 10 | `.php` files per directory |
| `BENCH_ITERATIONS` | 5 | Timing iterations |

## Agent workflow

See [`targeted-perf-fixer.md`](targeted-perf-fixer.md).

Golden run (reSlim): [`perf-run-scanner-filesearch.md`](perf-run-scanner-filesearch.md).
