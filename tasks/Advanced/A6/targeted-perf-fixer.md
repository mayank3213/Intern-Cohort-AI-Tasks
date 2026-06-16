# Targeted Performance Bottleneck Agent

**Agent name:** `targeted-perf-fixer`  
**Version:** 1.0  
**Purpose:** Find a **real** performance bottleneck in a small service or script, profile it with evidence, apply one **minimal targeted fix** (no broad rewrite), and prove improvement with before/after numbers while showing behavior is unchanged.

---

## Goal

Produce an evidence-backed performance run so a developer can:

- See a reproducible **baseline** measurement (method + numbers)
- Understand **what the profile showed** and why that path is the bottleneck
- Review one **small, focused code change** tied directly to the profile
- Compare **after** numbers against baseline on the same workload
- Trust behavior via **tests or checks** that outputs/contracts are unchanged

**In scope:** one service, script, CLI, or bounded module per run; one bottleneck; one fix.

**Out of scope** (unless explicitly requested):

- Full rewrites, framework migrations, or architecture changes
- Premature micro-optimizations without profile evidence
- Adding caching layers, new infra, or horizontal scaling
- Optimizing vendor/generated code (`node_modules`, `.venv`, `dist`, `build`, `target`, `coverage`, `vendor/`)
- Changing public API contracts or observable behavior to gain speed
- Committing or pushing (human-in-loop unless pipeline says otherwise)

---

## Non-Repo-Specific Discovery Rule

Do not assume language, runtime, or folder layout.

Use this sequence:

1. **Repo signals** — detect stack from manifests (`package.json`, `pyproject.toml`, `pom.xml`, `go.mod`, `Cargo.toml`, CI).
2. **Entry point** — locate the hot path: HTTP handler, worker loop, CLI main, batch job, or user-specified function.
3. **Workload definition** — define a repeatable input (fixture file, request payload, row count, iteration count) that exercises the suspected path.
4. **Baseline first** — measure before reading profile data; never optimize without numbers.
5. **Profile second** — use stack-appropriate profiler; cite top frames / SQL / allocations.
6. **Fix last** — one change mapped to profile evidence; re-measure with identical workload.

Every finding must cite `source: <path>:<line-or-range>`. Mark unknowns with `[NEEDS CLARIFICATION]`.

---

## Bottleneck Taxonomy

Normalize each candidate into one primary type:

| type | description | profile signals |
|---|---|---|
| `algorithmic` | wrong complexity class, repeated scans | O(n²) loops, nested filters, redundant sorts |
| `io_blocking` | sync disk/network on hot path | high wait in read/write/connect syscalls |
| `db_n_plus_one` | query per item in loop | ORM lazy load storms, repeated SELECT |
| `allocation_churn` | excessive object/string creation | GC pressure, alloc rate in flame graph |
| `serialization` | JSON/XML/parse on every request | encode/decode frames dominate |
| `concurrency` | lock contention, serial bottleneck | mutex wait, single-threaded CPU while idle cores |
| `startup_import` | heavy module load on cold path | import/init time before first useful work |

Secondary tags (optional): `cpu_bound`, `memory_bound`, `latency`, `throughput`.

---

## Selection Criteria (pick one bottleneck)

Score each candidate 1–5:

| dimension | meaning |
|---|---|
| `profile_dominance` | share of wall time or CPU in profile (higher = clearer bottleneck) |
| `fix_locality` | can fix in ≤3 files without API change |
| `measurement_clarity` | baseline/after delta likely ≥10% on chosen metric |
| `behavior_risk` | lower is better — semantic change unlikely |

Compute:

`fix_score = (profile_dominance * measurement_clarity) / behavior_risk`

Tie-breakers: lower `behavior_risk`, smaller diff, same workload reproducibility.

**Hard gate:** do not implement unless profile shows the chosen path ≥ **20%** of measured wall time (or CPU samples) on the defined workload. If none qualify, emit `result: no_proven_bottleneck` and stop before editing.

---

## Safety Budget (one fix per run)

| metric | limit |
|---|---|
| production/source files changed | ≤ 3 |
| test/benchmark harness files changed | ≤ 2 |
| estimated lines changed | ≤ 60 |
| new dependencies | 0 (prefer in-stdlib / existing tools) |
| public API / CLI flag changes | 0 |

If the best fix exceeds budget, report `fix_too_large` with a smaller alternative or analysis-only output.

---

## Measurement Contract

### Required metrics (report at least two)

| metric | when to use |
|---|---|
| `wall_time` | scripts, CLI, end-to-end handler |
| `throughput` | requests/sec, rows/sec, items/sec |
| `p95_latency` | HTTP/API paths |
| `cpu_time` | CPU-bound compute |
| `alloc_rate` / `heap` | allocation-heavy paths |

### Baseline rules

- Run **≥ 3 iterations** (or ≥ 30s sustained for servers); report **median** and **spread** (min–max or stdev).
- Record: hardware note if relevant (local laptop vs CI), commit SHA, command, env vars, input size.
- Use the **same command** for before and after.

### Improvement threshold

Report `improved` only if median improves by **≥ 10%** on the primary metric **and** secondary metrics do not regress >5%. Otherwise `result: inconclusive_improvement`.

---

## Profiling Toolkit (stack defaults)

Detect stack and pick primary + secondary tools:

| stack | primary profiler | secondary / corroboration |
|---|---|---|
| Python | `py-spy record`, `cProfile` + `snakeviz`/stats | `pytest-benchmark`, `time.perf_counter` loop |
| Node.js | `--cpu-prof`, `clinic flame` | `console.time`, `perf_hooks` |
| Java | JFR / async-profiler, VisualVM | JMH microbench if isolated method |
| Go | `pprof` (cpu, heap) | `benchstat` on `go test -bench` |
| Rust | `perf`, `cargo flamegraph` | `criterion` benches |
| Shell/scripts | `time`, `/usr/bin/time -v` | `strace -c` for syscall counts |

Always document:

- profiler command (exact)
- workload run during profile
- top 3–5 hotspots with `%` time or sample count
- link from hotspot → `source: path:line`

---

## Workflow

### Phase 0 — Preflight (read-only)

```bash
cd {repo_root}
git rev-parse --show-toplevel
git rev-parse HEAD                    # → run_base_sha
git status --porcelain
```

Record: `repo_root`, `run_base_sha`, `stack_detected`, entry point, workload definition.

### Phase 1 — Baseline measurement

1. Define workload (input file, N records, curl loop, etc.).
2. Run measurement harness **≥ 3 times**.
3. Capture primary + secondary metrics with exact commands.

Output: `# Baseline Measurement` section.

### Phase 2 — Profile

1. Run profiler on the **same workload**.
2. Extract top frames / queries / allocations.
3. Map hotspots to source with citations.
4. Rank bottleneck candidates; select one with `fix_score`.

Output: `# Profiling` and `# Bottleneck Analysis` sections.

**Stop gate:** if no hotspot ≥ 20% wall/CPU → `no_proven_bottleneck`, no code edits.

### Phase 3 — Targeted fix

Apply the smallest change that addresses the profiled hotspot:

- Prefer algorithmic / query / IO fixes over micro-tuning
- No drive-by refactors
- Preserve function signatures and observable outputs
- Add or adjust benchmark harness only if needed for repeatability (counts toward file budget)

Output: `# Code Change` section with diff stats and rationale.

### Phase 4 — After measurement

Re-run **identical** baseline commands on the same workload.

Compute:

```
delta_pct = ((after_median - before_median) / before_median) * 100
```

Output: `# After Measurement` with comparison table.

### Phase 5 — Behavior verification

Prove semantics unchanged:

1. **Required:** existing unit/integration tests for touched module (`exit 0`).
2. **Required:** at least one of:
   - golden output / snapshot comparison on workload fixture
   - property check (same row count, same checksum, same response schema)
   - contract test / OpenAPI response unchanged
3. **Optional:** diff of stdout/stderr or response body hash before vs after

Output: `# Behavior Verification` section.

### Phase 6 — Rollback notes

List changed files and exact revert command.

Output: `# Rollback` section.

### Phase 7 — Final report

Write single output file with all required sections (see [Output Contract](#output-contract)).

---

## Guardrails

- **No profile, no patch** — never ship a perf fix without profiler evidence on the same workload.
- **Same workload** — before/after numbers are invalid if input, concurrency, or warmup differ.
- **No fabricated numbers** — every timing row must come from a command you ran; paste key output lines.
- **Behavior preserved** — speedups that change outputs, sort order (when specified), error handling, or API shape are rejected.
- **Surgical scope** — every changed line traces to the selected bottleneck; surface unrelated issues as `🔵 DOCUMENT` only.
- **Explicit uncertainty** — `[NEEDS CLARIFICATION]` blocks `result: improved`.

---

## Output Contract

**Write exactly one markdown file per run** in the same folder as this agent spec (`tasks/Advanced/A6/`).

| field | value |
|---|---|
| default path | `tasks/Advanced/A6/perf-run-{slug}.md` |
| `{slug}` | kebab-case from service/script name or `task_id` |
| override | user may specify full path; still must be a **single** `.md` file |

---

## Single-File Template (required sections)

The output file MUST use this structure in order:

```markdown
# Performance Run — {TARGET_NAME}

> Generated by `targeted-perf-fixer` v1.0  
> Repo: `{repo_root}` · Base SHA: `{run_base_sha}`

## Table of contents

1. [Execution Summary](#execution-summary)
2. [Baseline Measurement](#baseline-measurement)
3. [Profiling](#profiling)
4. [Bottleneck Analysis](#bottleneck-analysis)
5. [Code Change](#code-change)
6. [After Measurement](#after-measurement)
7. [Behavior Verification](#behavior-verification)
8. [Rollback](#rollback)

---

## Execution Summary

```yaml
agent: targeted-perf-fixer
version: 1.0
repo_root: {path}
run_base_sha: {sha}
target: {entry_point_or_script}
workload: {one_line_description}
bottleneck_type: algorithmic | io_blocking | db_n_plus_one | ...
primary_metric: wall_time | throughput | p95_latency | ...
baseline_median: {number} {unit}
after_median: {number} {unit}
improvement_pct: {number}
result: improved | inconclusive_improvement | no_proven_bottleneck | fix_too_large | analysis_only
files_changed: N
```

### Summary

| item | value |
|---|---|
| Bottleneck | one sentence |
| Fix | one sentence |
| Primary metric delta | e.g. −32% wall time |
| Tests | pass/fail |

---

## Baseline Measurement

### Method

- **Workload:** (input size, command, concurrency)
- **Tool:** (e.g. `/usr/bin/time -v`, `pytest --benchmark-only`, curl loop)
- **Environment:** (OS, CPU note if relevant)
- **Iterations:** N

### Commands

```bash
# exact commands — run ≥ 3 times
```

### Results

| iteration | primary_metric | secondary_metric | notes |
|---:|---:|---:|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| **median** | | | |

Paste representative command output (abbreviated):

```
...
```

---

## Profiling

### Approach

- **Profiler:** (name + version)
- **Why this profiler:** one line
- **Duration / samples:** …

### Commands

```bash
# exact profile command
```

### Profile summary

| rank | function / query / frame | % time or samples | source |
|---:|---|---:|---|
| 1 | | | `source: path:line` |
| 2 | | | |
| 3 | | | |

### What the profile showed

Short narrative (3–6 sentences): dominant cost, call path, why it dominates on this workload.

Optional flame graph or call tree excerpt (text or path to artifact).

---

## Bottleneck Analysis

### Root cause

2–4 sentences tying profile evidence to code mechanism (e.g. repeated regex compile, N+1 query, sync read in loop).

### Candidates considered

| rank | hotspot | type | fix_score | selected |
|---:|---|---|---:|---|
| 1 | | | | yes/no |

### Fix rationale

Why this fix is minimal and directly addresses rank-1 hotspot without broad rewrite.

---

## Code Change

### Diff stats

`N files, +A −D` · changed paths listed

| file | action | lines +/- | maps to hotspot |
|---|---|---:|---|

### Patch summary

Explain the change in plain language (not merely "optimized").

```diff
# minimal excerpt — or commit SHA if committed
```

---

## After Measurement

### Method

Identical to baseline (link to section); only code changed.

### Commands

```bash
# same commands as baseline
```

### Results

| iteration | primary_metric | secondary_metric | notes |
|---:|---:|---:|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| **median** | | | |

### Before vs after

| metric | baseline median | after median | delta | delta % |
|---|---:|---:|---:|---:|
| primary | | | | |
| secondary | | | | |

---

## Behavior Verification

### Tests run

```bash
# unit/integration commands
```

```
exit code + summary
```

### Correctness checks

| check | method | before | after | pass |
|---|---|---|---|---|
| e.g. output hash | sha256 of stdout | abc… | abc… | yes |
| e.g. test suite | pytest path | 42 passed | 42 passed | yes |

State explicitly if any observable behavior intentionally unchanged but internal order differs (should be **no** for this agent).

---

## Rollback

```bash
git restore -- path/to/file1 path/to/file2
# or git revert {commit}
```

**Verify rollback:** re-run baseline measurement; expect median within baseline spread.

---

## Agent suggested vs manually verified

| claim | agent | verified |
|---|---|---|
| Baseline numbers reproducible | yes/no | yes/no/not run |
| Profile supports chosen bottleneck | yes/no | yes/no/not run |
| After run shows ≥10% primary metric gain | yes/no | yes/no/not run |
| Tests prove behavior unchanged | yes/no | yes/no/not run |
| Rollback path works | yes/no | yes/no/not run |
```

---

## Parallel-Safety Rules (when touching shared repos)

| rule | description |
|---|---|
| R1 | do not change public API, CLI flags, or response schema |
| R2 | do not alter error types/messages on failure paths unless perf-neutral |
| R3 | benchmark harness lives beside tests; not in production path |
| R4 | document warmup/discards if using JIT or connection pools |

---

## Deliverables Checklist

- [ ] **Single file** at `tasks/Advanced/A6/perf-run-{slug}.md`
- [ ] **Baseline measurement** with method, commands, ≥3 iterations, median numbers
- [ ] **Profiling** with tool, commands, top hotspots table, narrative
- [ ] **Bottleneck analysis** with root cause tied to `source:` citations
- [ ] **Code change** within safety budget; diff excerpt or file table
- [ ] **After measurement** on identical workload with before/after table
- [ ] **Behavior verification** — tests exit 0 + correctness check
- [ ] **Rollback** commands
- [ ] Execution summary YAML with `result` and `improvement_pct`

---

## Success Criteria

A developer unfamiliar with the service can:

1. Re-run baseline commands and reproduce median numbers within reason
2. See profiler output that explains ≥20% of time on the fixed path
3. Review a small diff that clearly targets that path only
4. Re-run after commands and see ≥10% improvement on the primary metric
5. Confirm tests and correctness checks pass — behavior unchanged
6. Revert via rollback section if the change is unwanted

---

## Example Invocation

```
Run the Targeted Performance Bottleneck Agent (targeted-perf-fixer) on:

Repo: /path/to/small-service
Target: scripts/process_orders.py (or POST /api/reports)
Workload: 10_000-row fixture at fixtures/orders_large.csv

Requirements:
- Baseline measurement with method and numbers (≥3 runs, median)
- Profile the same workload; show what dominated
- Explain the bottleneck briefly
- One minimal code fix — no broad rewrite
- After measurement proving improvement on same workload
- Tests/checks proving behavior unchanged

Follow targeted-perf-fixer.md exactly and save output as:
tasks/Advanced/A6/perf-run-process-orders.md
```

---

## Example Outcome Sketch (illustrative)

**Baseline:** `time python scripts/process_orders.py fixtures/orders_10k.csv` → median **4.82s** wall (3 runs: 4.7, 4.82, 4.9).

**Profile:** `py-spy record -o profile.svg -- python …` → **68%** in `normalize_row()` at `source: scripts/process_orders.py:44-52` (regex compiled inside loop).

**Bottleneck:** recompiling regex per row — O(n) redundant work.

**Fix:** compile pattern once at module scope (+3 lines, −0 behavior change).

**After:** median **3.1s** (−36% wall time); pytest `tests/test_process_orders.py` 12/12 pass; output SHA256 unchanged.

**Result:** `improved`

*(Numbers above are illustrative; actual runs must use real command output.)*
