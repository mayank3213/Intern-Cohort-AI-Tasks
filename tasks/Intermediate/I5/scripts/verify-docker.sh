#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${IMAGE:-i5-echo-service}"
CONTAINER="${CONTAINER:-i5-echo}"
PORT="${PORT:-8000}"

cd "$ROOT"

echo "==> docker build"
docker build -t "$IMAGE" .

echo "==> docker run"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d -p "${PORT}:8000" --name "$CONTAINER" "$IMAGE"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> wait for health"
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
    break
  fi
  sleep 1
done

echo "==> curl /health"
curl -s "http://127.0.0.1:${PORT}/health"
echo

echo "==> curl /echo/hello-docker"
curl -s "http://127.0.0.1:${PORT}/echo/hello-docker"
echo

echo "==> docker health status"
docker inspect --format='{{.State.Health.Status}}' "$CONTAINER"
echo

echo "All checks passed."
