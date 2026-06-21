#!/usr/bin/env bash
# Generate sustained HTTP traffic against the echo API.
set -euo pipefail

BASE_URL="${APP_BASE_URL:-http://127.0.0.1:8080}"
REQUESTS="${LOAD_REQUESTS:-120}"
CONCURRENCY="${LOAD_CONCURRENCY:-4}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require curl

if ! curl -sf "${BASE_URL}/health" >/dev/null; then
  echo "ERROR: app not reachable at ${BASE_URL} — run ./scripts/obs-up.sh first"
  exit 1
fi

echo "==> Load test against ${BASE_URL}"
echo "    requests=${REQUESTS} concurrency=${CONCURRENCY}"

if command -v hey >/dev/null 2>&1; then
  hey -z 20s -c "$CONCURRENCY" "${BASE_URL}/echo/load-test"
  hey -z 5s -c 1 "${BASE_URL}/not-found" >/dev/null 2>&1 || true
elif command -v ab >/dev/null 2>&1; then
  ab -n "$REQUESTS" -c "$CONCURRENCY" "${BASE_URL}/echo/load-test"
  curl -sf -o /dev/null -w "404 probe: %{http_code}\n" "${BASE_URL}/not-found" || true
else
  echo "hey/ab not found — using curl loop"
  for i in $(seq 1 "$REQUESTS"); do
    curl -sf "${BASE_URL}/echo/load-${i}" >/dev/null
    if (( i % 20 == 0 )); then
      curl -sf -o /dev/null "${BASE_URL}/not-found" || true
    fi
  done
fi

echo ""
echo "OK: load complete — run ./scripts/verify-metrics.sh"
