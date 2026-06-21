#!/usr/bin/env bash
# Port-forward to the ClusterIP service and curl /health; confirm ConfigMap env is mounted.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAMESPACE="${K8S_NAMESPACE:-d4-echo}"
SERVICE="${K8S_SERVICE:-d4-echo-api}"
LOCAL_PORT="${LOCAL_PORT:-18080}"
PF_PID=""

cleanup() {
  if [[ -n "$PF_PID" ]] && kill -0 "$PF_PID" 2>/dev/null; then
    kill "$PF_PID" 2>/dev/null || true
    wait "$PF_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require kubectl
require curl

if ! kubectl get deployment "$SERVICE" -n "$NAMESPACE" >/dev/null 2>&1; then
  echo "ERROR: deployment/$SERVICE not found in namespace $NAMESPACE — run ./scripts/deploy.sh first"
  exit 1
fi

echo "==> ConfigMap env mounted in pod"
POD="$(kubectl get pods -n "$NAMESPACE" -l app=d4-echo-api -o jsonpath='{.items[0].metadata.name}')"
kubectl exec -n "$NAMESPACE" "$POD" -- env | grep -E '^(LOG_LEVEL|APP_NAME)='

echo ""
echo "==> Port-forward svc/$SERVICE ${LOCAL_PORT}:80"
kubectl port-forward -n "$NAMESPACE" "svc/$SERVICE" "${LOCAL_PORT}:80" >/dev/null 2>&1 &
PF_PID=$!

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${LOCAL_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo ""
echo "==> curl /health"
RESPONSE="$(curl -sf "http://127.0.0.1:${LOCAL_PORT}/health")"
echo "$RESPONSE"

if ! echo "$RESPONSE" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
  echo "ERROR: unexpected /health response"
  exit 1
fi

echo ""
echo "==> curl /echo/d4-k8s"
curl -sf "http://127.0.0.1:${LOCAL_PORT}/echo/d4-k8s"
echo ""

echo ""
echo "OK: service responds on /health via port-forward"
