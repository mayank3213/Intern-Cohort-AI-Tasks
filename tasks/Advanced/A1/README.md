# A1 — Multi-Worktree Parallel Plan (45 min)

## Goal

Take **one feature or analysis task** and split it safely into **parallel worktrees or agent sessions** — without creating merge chaos. Produce a single consolidated plan that a downstream executor (A2) or human can follow.

**This exercise is plan-only.** Do **not** create git worktrees, commits, merges, or code changes in A1. Execution belongs in [A2](../A2/README.md).

## Target repo

**Primary:** `extras/cloned-repos/reSlim/` at repo root (PHP Slim 3 REST API).

```bash
# from repo root — if not already present
git submodule update --init extras/cloned-repos/reSlim
```

**Alternate targets:** `tasks/Basics/B4`, `tasks/Advanced/A4/starter/` — use only if instructed.

## Suggested practice task

**A1-DEMO:** Parallel README + config hardening in `extras/cloned-repos/reSlim/` with **disjoint file ownership**:

- **Lane 1:** align `readme.md` PHP version wording with `src/composer.json`
- **Lane 2:** harden placeholder credentials in `src/config.php`

Both lanes touch different files — safe to parallelize. See the golden sample for a completed plan.

## Deliverables

Submit **one markdown file** (`parallel-plan-{slug}.md`) with these sections **in order**:

1. **Execution Summary** — YAML metadata: `task_id`, `repo_root`, `lane_count`, `result` (`parallelizable` or `unsafe_to_parallelize`), A2 handoff block
2. **Task Breakdown** — work units, lane assignment, file ownership with `source: path` citations
3. **Worktrees & Branches** — branch names, worktree paths, lane scope table
4. **Shared Constraints** — what every lane agent must obey (no force-push, file ownership, test commands)
5. **Agent Prompts** — copy-paste-ready prompt per lane (scope, files, AC, stop conditions)
6. **Merge Order** — deterministic merge sequence with dependency rationale
7. **Risk Analysis** — top risks (conflict, scope creep, missing deps) with mitigations
8. **Verification Plan** — repo-appropriate commands to run after integration merge

Include at least one **Mermaid diagram** showing lane decomposition or merge order.

## Rules

- **2–5 parallel lanes** (minimum 2 when parallelization is viable; cap at 5)
- Each mutable file owned by **exactly one** lane writer — or document an explicit shared-file protocol
- If overlapping write ownership cannot be resolved → emit `result: unsafe_to_parallelize` and stop
- Exclude vendor/generated dirs (`.venv`, `node_modules`, `vendor`, `dist`, `build`, `target`)
- Cite `source: path:line-range` for owned files and task requirements
- Mark unverified claims with `[NEEDS VERIFICATION]`

## Time box

| Phase | Minutes |
|-------|---------|
| Repo discovery + task intent | 10 |
| Dependency graph + lane partition | 15 |
| Prompts, constraints, merge order | 10 |
| Risk register + verification plan | 10 |

## Pass criteria

- [ ] Task decomposed into 2–5 lanes with disjoint file ownership (or `unsafe_to_parallelize` with evidence)
- [ ] Branch and worktree naming scheme documented per lane
- [ ] Copy-paste agent prompt for **each** lane with scope, files, and acceptance criteria
- [ ] Shared constraints listed (ownership, no force-push, verification commands)
- [ ] Merge order specified with conflict expectations
- [ ] Risk register with ≥3 items and mitigations
- [ ] Verification plan names concrete commands (tests, lint, build)
- [ ] A2 handoff block present (plan path, repo root, integration branch)
- [ ] Completed within 45 minutes

## Layout

```
A1/
├── README.md                          # this file
├── parallel-task-splitter.md          # agent workflow spec
├── parallel-plan-a1-demo.md           # golden sample (reSlim A1-DEMO)
└── parallel-plan-{your-slug}.md       # your deliverable
```

## Agent workflow

For AI-assisted runs, follow [`parallel-task-splitter.md`](parallel-task-splitter.md).

Golden sample: [`parallel-plan-a1-demo.md`](parallel-plan-a1-demo.md).

## Next step

Hand your plan to [A2 — Execute Two Parallel Worktrees](../A2/README.md).
