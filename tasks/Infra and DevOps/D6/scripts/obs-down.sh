#!/usr/bin/env bash
# Stop observability stack and remove volumes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_DIR="$ROOT/observability"

cd "$COMPOSE_DIR"
docker compose down -v

echo "OK: stack stopped"
