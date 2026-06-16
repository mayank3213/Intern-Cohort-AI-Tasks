#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "ERROR: install Docker Compose (docker compose plugin or docker-compose)" >&2
  exit 1
fi

API_PORT="${API_PORT:-8080}"
export API_PORT

echo "==> docker compose up --build -d"
"${COMPOSE[@]}" up --build -d

echo "==> wait for api health on port ${API_PORT}"
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
    echo "api healthy"
    exit 0
  fi
  sleep 2
done

echo "ERROR: api did not become healthy in time" >&2
"${COMPOSE[@]}" ps
exit 1
