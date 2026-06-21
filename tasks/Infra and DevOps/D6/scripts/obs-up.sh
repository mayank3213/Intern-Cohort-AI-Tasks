#!/usr/bin/env bash
# Start app + Prometheus + Grafana.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_DIR="$ROOT/observability"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require docker

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose v2 is required"
  exit 1
fi

cd "$COMPOSE_DIR"

echo "==> docker compose up --build -d"
docker compose up --build -d

echo ""
echo "==> Waiting for app /health"
for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "OK: stack is up"
echo "  App:        http://127.0.0.1:8080/health"
echo "  Metrics:    http://127.0.0.1:8080/metrics"
echo "  Prometheus: http://127.0.0.1:9090"
echo "  Grafana:    http://127.0.0.1:3000 (admin / admin)"
echo "Next: ./scripts/load.sh && ./scripts/verify-metrics.sh"
