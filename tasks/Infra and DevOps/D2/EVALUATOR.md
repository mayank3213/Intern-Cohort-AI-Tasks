# D2 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Stack profile

| Field | Value |
|-------|-------|
| Profile | Docker Compose multi-service |
| Task root | `tasks/Infra and DevOps/D2` |
| Stack name | `d2-job-stack` |
| Services | `db`, `api`, `worker` |

## Expected compose services

| Service | Image / build | Role |
|---------|---------------|------|
| `db` | `postgres:16-alpine` | Postgres with init scripts in `/docker-entrypoint-initdb.d/` |
| `api` | build `./api` | FastAPI — POST/GET jobs, health with DB ping |
| `worker` | build `./worker` | Polls `pending` jobs, uppercases payload, marks `done` |

### Health and dependencies

- `db` healthcheck: `pg_isready`
- `api` depends on healthy `db`; publishes port `${API_PORT:-8080}:8080`
- `worker` depends on healthy `db` and `api`; polls every `${WORKER_POLL_SECONDS:-2}s`

### Seed data contract

| file | content |
|------|---------|
| `db/init/01-schema.sql` | `jobs` table + status index |
| `db/init/02-seed.sql` | row `id=seed-welcome`, `status=done`, `result=HELLO FROM SEED DATA` |

Seed runs only on **first** volume creation. Teardown must use `docker compose down -v`.

## E2E test contract

File: `tests/test_e2e.py` — runs against live stack via `API_BASE_URL`.

| Test | Proves |
|------|--------|
| `test_health` | API up, returns `{"status":"ok"}` |
| `test_seeded_job_readable` | Init scripts ran (`GET /jobs/seeded` → `seed-welcome`) |
| `test_api_worker_pipeline` | POST job → worker processes → GET returns `done` + uppercased result |

Expected pytest summary: **3 passed**.

## Verification commands

### One-command E2E (must pass)

```bash
cd "tasks/Infra and DevOps/D2"
chmod +x scripts/*.sh
./scripts/run-e2e.sh
# Expected exit 0, final line: All E2E checks passed.
# Expected pytest: 3 passed
```

### Inter-service log proof

After E2E, `run-e2e.sh` tails api + worker logs. Expect patterns like:

| step | service | pattern |
|------|---------|---------|
| ingest | api | `created job job-... status=pending` |
| poll | worker | `processing job job-...` |
| complete | worker | `completed job job-... result='DOCKER COMPOSE E2E'` |

Manual grep:

```bash
docker compose logs --no-color api worker | grep -E 'created job|processing job|completed job|GET /jobs'
```

### Teardown and clean re-up

```bash
./scripts/stack-down.sh
./scripts/stack-up.sh
./scripts/run-e2e.sh
# Second E2E must pass (fresh volume, seed re-applied)
```

## Pass criteria

- [ ] `docker-compose.yml` defines `db`, `api`, and `worker`
- [ ] Per-service Dockerfiles under `api/` and `worker/`
- [ ] Seed/fixture SQL in `db/init/` (schema + seed row)
- [ ] `./scripts/run-e2e.sh` exits 0 with 3 passing tests
- [ ] Log sample shows api and worker interaction (not api-only)
- [ ] `./scripts/stack-down.sh` removes volumes (`down -v`)
- [ ] Clean re-up + E2E passes from zero
- [ ] README documents up, E2E, logs, down, re-up

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| `connection refused` on E2E | Stack not up or wrong `API_PORT` / `API_BASE_URL` |
| `test_seeded_job_readable` 404 | Volume not fresh — seed not applied; run `stack-down.sh` first |
| `test_api_worker_pipeline` timeout | Worker not running or poll interval too slow |
| Docker daemon error | Docker Desktop / Colima not started |
| Port 8080 in use | Set `API_PORT=8081` and matching `API_BASE_URL` |
| Init scripts skipped | Reused `pgdata` volume — use `down -v` |

## Optional manual smoke

```bash
./scripts/stack-up.sh
curl -s http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/jobs/seeded
curl -s -X POST http://127.0.0.1:8080/jobs \
  -H 'Content-Type: application/json' -d '{"payload":"hello"}'
./scripts/stack-down.sh
```
