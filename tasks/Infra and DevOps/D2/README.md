# D2 — Multi-Service Docker Compose Stack (Demo)

Job processing stack: **FastAPI API** + **PostgreSQL** + **Python worker**.

## Architecture

```
POST /jobs  -->  api  -->  db (pending row)
                              ^
worker polls db ------------|
worker updates row (done) --> db
GET /jobs/{id}  <--  api  <-- db
```

## Prerequisites

- Docker 24+ with Compose v2 (`docker compose`)
- Python 3.10+ (host, for E2E tests only)
- `curl`

## Quick start

From this directory:

```bash
chmod +x scripts/*.sh
./scripts/run-e2e.sh
```

One command brings the stack up, waits for health, runs pytest against the live API, and prints a log sample.

## Commands

| action | command |
|---|---|
| up | `./scripts/stack-up.sh` |
| E2E | `./scripts/run-e2e.sh` |
| logs | `docker compose logs -f api worker db` |
| down (remove volumes) | `./scripts/stack-down.sh` |
| clean re-up + E2E | `./scripts/stack-down.sh && ./scripts/stack-up.sh && ./scripts/run-e2e.sh` |

## Environment

| variable | default | used by |
|---|---|---|
| `API_PORT` | `8080` | compose port publish, health wait |
| `API_BASE_URL` | `http://127.0.0.1:8080` | E2E tests |
| `WORKER_POLL_SECONDS` | `2` | worker container |
| `DATABASE_URL` | set in compose | api + worker |

## Seed data

`db/init/02-seed.sql` inserts job `seed-welcome` with status `done`. E2E test `test_seeded_job_readable` proves init scripts ran on a fresh volume.

## Manual smoke

```bash
./scripts/stack-up.sh
curl -s http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/jobs/seeded
curl -s -X POST http://127.0.0.1:8080/jobs -H 'Content-Type: application/json' -d '{"payload":"hello"}'
```

Watch worker logs:

```bash
docker compose logs -f worker
```

Teardown:

```bash
./scripts/stack-down.sh
```
