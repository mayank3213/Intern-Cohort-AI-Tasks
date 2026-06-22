# I1 — ER Diagram from Repo (45 min)

## Goal

Build an **entity-relationship inventory** for every persisted table in this repository. Use **only the repo** as your source. Cite the source file (and line range when possible) for every table, entity, and relationship.

## Setup

```bash
# from repo root — see tasks/Intermediate/README.md for full setup
git submodule update --init extras/cloned-repos/reSlim
```

Primary schema: `reSlim/resources/database/reSlim.sql`  
Secondary (in-memory, non-relational): `tasks/Basics/B4`, `tasks/Basics/B5`

## Deliverables

Submit a single markdown report with these sections **in order**:

1. **Tables inventory** — table name, column summary, primary key, `source: path:lines`
2. **Application entities** — PHP/Python/JS class → table mapping with sources
3. **Primary keys** — per table, note composite / auto-increment
4. **Foreign keys & relationships** — declared vs inferred; cite DDL or JOIN SQL
5. **Non-relational models** — in-memory stores (B4/B5) or "None"
6. **Mermaid ER diagram** — valid `erDiagram` block covering all SQL tables
7. **Manual follow-up** — gaps, missing DDL, low-confidence joins

## Rules

- Exclude vendor dirs (`.venv`, `node_modules`, `vendor`)
- Do not fabricate tables or columns
- Prefer DDL over naming heuristics for FKs
- Mermaid types: use `string`, `int`, `float`, `bool` (not SQL types)

## Hints

- reSlim has **8 tables** in `reSlim.sql` with **11 declared foreign keys**
- Hub tables: `user_data`, `core_status`, `user_role`
- B4/B5 ledger apps have **no SQL** — list them under non-relational only

## Reference

- Agent workflow: [`er-diagram-mapper.md`](er-diagram-mapper.md)
- Golden sample: [`agent-run-output-agent.md`](agent-run-output-agent.md)
