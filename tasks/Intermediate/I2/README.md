# I2 — End-to-End Flow Trace (45 min)

## Goal

Trace **one** HTTP endpoint, event handler, or cron job from entry point through every major layer to final side effects (database, API, queue). Produce a source-cited call path and Mermaid sequence diagram.

## Setup

```bash
git submodule update --init extras/cloned-repos/reSlim
```

**Recommended anchor:** `POST /user/login` in reSlim (authentication flow with DB reads + token insert).

You may choose a different anchor — state it clearly in your report.

## Deliverables

1. **Entry point** — method/path, handler symbol, file, middleware chain, source citation
2. **Call path** — numbered steps: file, function, role (handler/service/repository), sync/async
3. **External dependencies** — database, cache, HTTP APIs; config pointer (env var names only)
4. **Side effects** — reads vs writes; table names and operations
5. **Sequence diagram** — Mermaid `sequenceDiagram` matching the call path (~8–20 messages)
6. **Known uncertainty** — dynamic dispatch, feature flags, cross-repo calls; or explicit "None"
7. **Manual follow-up** — error branches not traced, suggested next traces

## Rules

- Trace **exactly one** flow
- Major hops only (controller → service → repository), not every helper
- Cite `path:line` for each hop and side effect
- Do not echo secrets from config files

## Verification tips

- Entry registration: `reSlim/src/routers/user.router.php`
- Bootstrap: `reSlim/src/api/index.php` → `reSlim/src/app/app.php`
- Schema context: `reSlim/resources/database/reSlim.sql`

## Reference

- Agent workflow: [`flow-tracer.md`](flow-tracer.md)
- Golden sample: [`agent-run-output-reslim.md`](agent-run-output-reslim.md)
