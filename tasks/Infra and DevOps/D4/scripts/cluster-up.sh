#!/usr/bin/env bash
# Create kind cluster and load the D3 echo service image (no new app — reuses D3/D5 FastAPI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_DIR="$(cd "$ROOT/../D3/service" && pwd)"
CLUSTER_NAME="${KIND_CLUSTER_NAME:-d4-echo}"
IMAGE_NAME="${D4_IMAGE:-d4-echo-api:1.0.0}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require docker
require kind
require kubectl

if kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
  echo "kind cluster '$CLUSTER_NAME' already exists — skipping create"
else
  echo "==> Creating kind cluster '$CLUSTER_NAME'"
  kind create cluster --name "$CLUSTER_NAME" --config "$ROOT/kind-config.yaml"
fi

echo ""
echo "==> Building image from D3 service: $SERVICE_DIR"
docker build -t "$IMAGE_NAME" "$SERVICE_DIR"

echo ""
echo "==> Loading image into kind"
kind load docker-image "$IMAGE_NAME" --name "$CLUSTER_NAME"

echo ""
echo "OK: cluster '$CLUSTER_NAME' ready, image '$IMAGE_NAME' loaded"
echo "Next: ./scripts/deploy.sh"
