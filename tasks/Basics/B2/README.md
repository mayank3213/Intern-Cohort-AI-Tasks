# B2 — API Endpoint Map (30 min)

## Goal

Identify **every externally exposed route** in an unfamiliar repository — HTTP/API endpoints and frontend navigation paths — and map each route to its handler/controller with source citations.

## Setup

```bash
# from repo root
git submodule update --init extras/cloned-repos/reSlim
```

**Primary target:** `extras/cloned-repos/reSlim/` (PHP Slim 3 REST API)

**Alternate targets (smaller):** `tasks/Basics/B4` (FastAPI), `tasks/Basics/B5` (Express)

## Deliverables

Submit a single markdown report with these sections **in order**:

1. **Route summary** — total routes by category (`api`, `frontend`, `proxy`, `contract`)
2. **API route table** — method, path, handler (class/function), `source: path:lines`
3. **Frontend routes** — path pattern, component/page, source (or "None" with evidence)
4. **Contract-only routes** — OpenAPI/Swagger/ingress rules not found in code (or "None")
5. **Gaps & uncertainty** — routes inferred from heuristics, test-only routes excluded

## Rules

- Include only routes reachable by external clients (browser, curl, mobile deep links)
- Exclude internal function calls, cron jobs, and queue consumers unless they register HTTP routes
- Prefer declarative registration (router calls, decorators) over naming guesses
- When method is ambiguous, note it explicitly

## Hints

- reSlim routes are registered in Slim route files under `reSlim/src/`
- B4 exposes `POST /transactions`, `GET /transactions`, `GET /balance`
- B5 mirrors B4 on the same paths — useful for a quick first pass

## Pass criteria

- [ ] Every externally exposed API route listed with method + path + handler
- [ ] Each route cites `source: path:line`
- [ ] Frontend/proxy/contract sections present (even if "None found")
- [ ] Completed within 30 minutes

## Reference

- Agent workflow: [`route-discovery-mapper.md`](route-discovery-mapper.md)
- Golden sample: [`agent-run-output-reslim.md`](agent-run-output-reslim.md)
