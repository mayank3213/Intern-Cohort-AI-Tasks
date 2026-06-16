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

echo "==> docker compose down -v"
"${COMPOSE[@]}" down -v --remove-orphans

echo "stack torn down (containers + volumes removed)"
