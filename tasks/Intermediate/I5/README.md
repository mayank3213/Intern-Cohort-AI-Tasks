# I5 Echo Service (Docker)

Small FastAPI service with `/health` and `/echo/{message}` endpoints, packaged for Docker.

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

## Local tests (without Docker)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```
