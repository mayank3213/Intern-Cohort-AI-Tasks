#!/usr/bin/env bash
# Dry-run then apply Kubernetes manifests.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
K8S_DIR="$ROOT/k8s"
CLUSTER_NAME="${KIND_CLUSTER_NAME:-d4-echo}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require kubectl

if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "ERROR: kubectl cannot reach a cluster. Run ./scripts/cluster-up.sh first"
  exit 1
fi

echo "==> kubectl apply --dry-run=client"
kubectl apply --dry-run=client -f "$K8S_DIR/namespace.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/configmap.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/deployment.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/service.yaml"

if [[ "${DEPLOY_INGRESS:-false}" == "true" ]]; then
  kubectl apply --dry-run=client -f "$K8S_DIR/ingress.yaml"
fi

echo ""
echo "==> kubectl apply"
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/configmap.yaml"
kubectl apply -f "$K8S_DIR/deployment.yaml"
kubectl apply -f "$K8S_DIR/service.yaml"

if [[ "${DEPLOY_INGRESS:-false}" == "true" ]]; then
  kubectl apply -f "$K8S_DIR/ingress.yaml"
fi

echo ""
echo "==> Waiting for rollout"
kubectl rollout status deployment/d4-echo-api -n d4-echo --timeout=120s

echo ""
echo "OK: manifests applied to cluster '$CLUSTER_NAME'"
echo "Next: ./scripts/verify.sh"
