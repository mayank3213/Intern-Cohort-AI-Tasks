#!/usr/bin/env bash
# Client-side dry-run only — no cluster required beyond kubectl context (optional).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
K8S_DIR="$ROOT/k8s"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require kubectl

echo "==> kubectl apply --dry-run=client (all core manifests)"
kubectl apply --dry-run=client -f "$K8S_DIR/namespace.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/configmap.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/deployment.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/service.yaml"
kubectl apply --dry-run=client -f "$K8S_DIR/ingress.yaml"

echo ""
echo "OK: dry-run passed for namespace, configmap, deployment, service, ingress"
