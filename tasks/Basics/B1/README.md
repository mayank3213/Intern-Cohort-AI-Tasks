# B1 — Repo Artifact Inventory (30 min)

## Goal

Inspect an **unfamiliar repository** and produce a structured inventory of its major code artifacts — classes, interfaces, services, controllers, models, repositories, jobs, consumers, configs, and utilities — with source citations for every finding.

## Setup

```bash
# from repo root
git clone --depth 1 https://github.com/aalfiann/reSlim.git reSlim
```

**Primary target:** `reSlim/` (PHP Slim 3 REST API)

**Alternate targets (smaller):** `tasks/Basics/B4` (FastAPI), `tasks/Basics/B5` (Express)

## Deliverables

Submit a single markdown report with these sections **in order**:

1. **Executive summary** — repo purpose, languages, frameworks, artifact counts by category
2. **Artifact inventory** — table: name, category, file path, line range, role/notes
3. **Coverage by category** — controllers, services, repositories, models, jobs, consumers, config, utilities, interfaces
4. **Architectural patterns** — layering, DI, routing style (with evidence)
5. **Gaps & uncertainty** — artifacts inferred with low confidence, dirs skipped and why

Every row in the inventory must cite `source: path:line-range`.

## Rules

- Exclude vendor/generated dirs (`.venv`, `node_modules`, `vendor`, `dist`, `build`, `target`)
- Do not list individual methods unless high-signal (`key_methods` on parent artifact only)
- Do not fabricate symbols — cite declaration sites
- Prefer explicit declarations (class/interface/decorator) over naming heuristics

## Hints

- reSlim entry point: `reSlim/public/index.php` → Slim app bootstrap
- Look under `reSlim/src/` for controllers, models, and middleware
- B4/B5 are single-module apps — good warm-up before reSlim

## Pass criteria

- [ ] All major artifact categories addressed (or explicitly "none found" with evidence)
- [ ] Every listed artifact cites `path:line`
- [ ] Vendor/generated code excluded
- [ ] Completed within 30 minutes

## Reference

- Agent workflow: [`code-artifact-mapper.md`](code-artifact-mapper.md)
- Golden sample: [`agent-run-output-reslim.md`](agent-run-output-reslim.md)
