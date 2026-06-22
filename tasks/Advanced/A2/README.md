# A2 — Execute Two Parallel Worktrees (90 min)

## Goal

**Actually create** two (or more) parallel git worktrees or branches, make **independent changes** in each lane, then **reconcile them cleanly** — merge in planned order, resolve conflicts, run verification, and produce proof artifacts.

A2 **executes** a plan from [A1](../A1/README.md). Do not re-plan lanes unless A1 marked `unsafe_to_parallelize`.

## Prerequisites

1. A completed A1 plan file — e.g. [`../A1/parallel-plan-a1-demo.md`](../A1/parallel-plan-a1-demo.md) or your own `parallel-plan-{slug}.md`
2. Target repo checked out and clean:

```bash
# from repo root
git submodule update --init extras/cloned-repos/reSlim   # if needed
cd extras/cloned-repos/reSlim
git status   # working tree should be clean before starting
```

**Primary target:** `extras/cloned-repos/reSlim/`  
**Practice plan:** A1-DEMO (2 lanes: `readme.md` + `src/config.php`)

## Deliverables

Submit **one markdown file** (`parallel-run-{slug}.md`) with these sections **in order**:

1. **Execution Summary** — YAML metadata: `task_id`, `plan_file`, `exec_base_sha`, `integration_branch`, `result` (`success`, `partial`, or `failed`)
2. **Execution Log** — phase timeline (preflight → worktrees → lanes → merges → verification)
3. **Worktree Commands** — exact `git worktree add` / remove commands used (verbatim)
4. **Lane Outputs** — per-lane: branch name, files changed, commit SHA, diff summary
5. **Commits** — commit messages and SHAs per lane
6. **Merge History** — merge order applied, integration branch tip SHA
7. **Conflicts** — conflicts encountered (or "none") with resolution steps
8. **Test Results** — verification commands run, exit codes, key output lines

Include **Mermaid diagrams** in major sections (worktree flow, merge order, verification).

## Rules

- Follow the A1 plan's lane ownership — do not edit files outside your lane scope
- Merge lanes in the **order specified** in the A1 `# Merge Order` section
- One commit per lane minimum; traceable commit messages referencing `task_id` and lane
- If A1 marked `unsafe_to_parallelize` → **stop** and return to A1
- Never force-push to `main`/`master` or rewrite shared history
- Exclude vendor/generated dirs from lane changes
- Document what the agent suggested vs what you manually verified

## Time box

| Phase | Minutes |
|-------|---------|
| Preflight + integration branch bootstrap | 10 |
| Create worktrees + lane execution | 40 |
| Merge + conflict reconciliation | 20 |
| Verification + report | 20 |

## Setup (A1-DEMO example)

Using the bundled demo plan against `extras/cloned-repos/reSlim/`:

```bash
cd extras/cloned-repos/reSlim

# Review the plan first
cat ../tasks/Advanced/A1/parallel-plan-a1-demo.md

# Expected integration branch from plan
# parallel/A1-DEMO/integration

# Create worktrees (paths from plan — adjust to your machine)
git worktree add .worktrees/A1-DEMO-readme -b parallel/A1-DEMO/readme master
git worktree add .worktrees/A1-DEMO-config -b parallel/A1-DEMO/config master
```

Apply each lane's prompt from the A1 plan, commit in each worktree, then merge into the integration branch in order (`readme` → `config`).

## Verification

Run commands from the A1 plan's `# Verification Plan` section. For reSlim A1-DEMO, typical checks:

```bash
# After integration merge
grep -i "PHP" readme.md                          # AC-1: no PHP 5.5 wording
grep "pass.*root" src/config.php || echo "ok"      # AC-2: no hardcoded root password
php -l src/config.php                            # AC-5: syntax check (if php available)
```

Record exit codes and output verbatim in `# Test Results`.

## Pass criteria

- [ ] Worktree creation commands documented and reproducible
- [ ] Each lane has its own branch with ≥1 scoped commit
- [ ] Lanes merged into integration branch in planned order
- [ ] Conflict notes present (even if "zero conflicts")
- [ ] Verification commands executed with results captured
- [ ] Agent suggested vs manually verified table included
- [ ] Rollback commands documented (worktree remove, branch delete)
- [ ] Completed within 90 minutes

## Layout

```
A2/
├── README.md                          # this file
├── parallel-worktree-executor.md      # agent workflow spec
├── parallel-run-a1-demo.md            # golden sample (reSlim A1-DEMO execution)
└── parallel-run-{your-slug}.md        # your deliverable
```

## Agent workflow

For AI-assisted runs, follow [`parallel-worktree-executor.md`](parallel-worktree-executor.md).

Golden sample: [`parallel-run-a1-demo.md`](parallel-run-a1-demo.md) — note this run was `result: partial` because `php`/`composer` were unavailable locally; grep-based AC checks still passed.

## Rollback (A1-DEMO)

If you need to tear down worktrees and branches after practice:

```bash
cd extras/cloned-repos/reSlim

git worktree remove .worktrees/A1-DEMO-readme --force
git worktree remove .worktrees/A1-DEMO-config --force
git branch -D parallel/A1-DEMO/readme
git branch -D parallel/A1-DEMO/config
git branch -D parallel/A1-DEMO/integration
git worktree prune
```

## Previous step

This exercise follows [A1 — Multi-Worktree Parallel Plan](../A1/README.md).
