# I5 — Dockerize and Run (60 min)

Containerize a FastAPI echo service so it **builds and runs cleanly in Docker**. Prove the container responds to HTTP and passes a health check.

This folder contains a **reference implementation** with Dockerfile, health check, and verification script.

## Pass criteria

- [ ] `docker build -t i5-echo-service .` succeeds
- [ ] `docker run --rm -p 8000:8000 i5-echo-service` responds to curl
- [ ] `docker inspect` shows health status `healthy` after start period
- [ ] README documents build, run, and verify commands

## Endpoints

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/health` | `{ "status": "ok" }` |
| `GET` | `/echo/{message}` | `{ "message": "<message>" }` |

## Prerequisites

- Docker 20+

## Build

From this directory (`tasks/Intermediate/I5`):

```bash
docker build -t i5-echo-service .
```

## Run

```bash
docker run --rm -p 8000:8000 --name i5-echo i5-echo-service
```

## Verify

Health check:

```bash
curl -s http://localhost:8000/health
```

Expected:

```json
{"status":"ok"}
```

Echo endpoint:

```bash
curl -s http://localhost:8000/echo/hello-docker
```

Expected:

```json
{"message":"hello-docker"}
```

Docker health status (after a few seconds):

```bash
docker inspect --format='{{.State.Health.Status}}' i5-echo
```

Expected: `healthy`

Automated verify script:

```bash
chmod +x scripts/verify-docker.sh
./scripts/verify-docker.sh
```

## Local tests (without Docker)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```
