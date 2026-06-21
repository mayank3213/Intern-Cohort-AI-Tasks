# Intermediate Eval — Repo Operator & Polyglot Builder

Six timed exercises for engineers working in unfamiliar repos. Each folder has a **task brief** (`README.md`), optional **agent spec** (`*-mapper.md`, etc.), and where applicable **golden sample output** or an **evaluator answer key**.

## Prerequisites (one-time setup)

From the repository root:

```bash
git clone --depth 1 https://github.com/aalfiann/reSlim.git reSlim
```

This pulls [aalfiann/reSlim](https://github.com/aalfiann/reSlim) (PHP Slim 3 REST API with MariaDB schema). Required for **I1**, **I2**, and **I6 (PHP variant)**.

> **Note:** Older checkouts pinned an invalid submodule commit. If `git submodule update` fails, use the clone command above instead.

| Task | Time | Target | Deliverable |
|------|------|--------|-------------|
| [I1](I1/README.md) | 45 min | `reSlim/` (+ optional Basics apps) | ER inventory + Mermaid `erDiagram` with source citations |
| [I2](I2/README.md) | 45 min | `reSlim/` | One flow trace + Mermaid `sequenceDiagram` |
| [I3](I3/README.md) | 60 min | `tasks/Basics/B4` or `B5` | Minimal diff + test + risk report |
| [I4](I4/README.md) | 90 min | `I4/` | FastAPI `/convert` + Node CLI + tests |
| [I5](I5/README.md) | 60 min | `I5/` | Dockerfile + running container proof |
| [I6](I6/README.md) | 60 min | `tasks/Basics/B5` | Reproduce bug, root cause, minimal fix |

## Golden samples & answer keys

| Task | Reference |
|------|-----------|
| I1 sample | [`I1/agent-run-output-agent.md`](I1/agent-run-output-agent.md) |
| I2 sample | [`I2/agent-run-output-reslim.md`](I2/agent-run-output-reslim.md) |
| I3 sample | [`I3/agent-run-output-b4-ledger.md`](I3/agent-run-output-b4-ledger.md) |
| I6 answer key | [`I6/EVALUATOR.md`](I6/EVALUATOR.md) |

I4 and I5 ship a **runnable reference implementation** in-repo for verification and agent benchmarking. See each task README for requirements and pass criteria.

## Agent skills

I1, I2, I3, and I6 include agent workflow specs (`er-diagram-mapper.md`, `flow-tracer.md`, `surgical-patcher.md`, `seeded-bug-diagnoser.md`) for AI-assisted eval runs.

## Hygiene

- Do **not** commit `.venv` — create locally: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Python tasks: 3.9+
- Node tasks: 18+ (built-in `fetch`)

## Pass criteria (summary)

| Task | Pass when |
|------|-----------|
| I1 | All tables listed, PKs/FKs cited, valid Mermaid ER |
| I2 | Entry → side effects traced with file:function citations, sequence diagram |
| I3 | ≤2 prod files, ≤1 test file, targeted test passes, risk table present |
| I4 | `/convert` works, CLI calls service, pytest + client verify pass |
| I5 | `docker build` succeeds, container responds to curl, health check green |
| I6 | Bug reproduced, root cause cited, fix verified, agent vs manual table |
