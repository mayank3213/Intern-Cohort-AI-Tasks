#!/usr/bin/env bash
# Remove workloads and delete the kind cluster.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
K8S_DIR="$ROOT/k8s"
CLUSTER_NAME="${KIND_CLUSTER_NAME:-d4-echo}"

if command -v kubectl >/dev/null 2>&1 && kubectl cluster-info >/dev/null 2>&1; then
  echo "==> Deleting Kubernetes resources"
  kubectl delete -f "$K8S_DIR/ingress.yaml" --ignore-not-found
  kubectl delete -f "$K8S_DIR/service.yaml" --ignore-not-found
  kubectl delete -f "$K8S_DIR/deployment.yaml" --ignore-not-found
  kubectl delete -f "$K8S_DIR/configmap.yaml" --ignore-not-found
  kubectl delete -f "$K8S_DIR/namespace.yaml" --ignore-not-found
fi

if command -v kind >/dev/null 2>&1 && kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
  echo ""
  echo "==> Deleting kind cluster '$CLUSTER_NAME'"
  kind delete cluster --name "$CLUSTER_NAME"
fi

echo ""
echo "OK: teardown complete"
