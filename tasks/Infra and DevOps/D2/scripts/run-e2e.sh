#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP=false
if [[ "${1:-}" == "--keep" ]]; then
  KEEP=true
fi

API_PORT="${API_PORT:-8080}"
export API_PORT
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:${API_PORT}}"

chmod +x scripts/stack-up.sh

echo "==> ensure stack is up"
./scripts/stack-up.sh

echo "==> install test deps (if needed)"
python3 -m pip install -q -r tests/requirements.txt

echo "==> run e2e tests against ${API_BASE_URL}"
python3 -m pytest tests/ -v --tb=short

echo
echo "==> inter-service log sample"
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "ERROR: install Docker Compose (docker compose plugin or docker-compose)" >&2
  exit 1
fi
"${COMPOSE[@]}" logs --no-color api worker | tail -n 30

if [[ "$KEEP" == false ]]; then
  echo
  echo "stack left running; use ./scripts/stack-down.sh to tear down"
fi

echo
echo "All E2E checks passed."
