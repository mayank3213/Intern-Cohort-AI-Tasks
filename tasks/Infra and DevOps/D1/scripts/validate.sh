#!/usr/bin/env bash
# Validate Terraform without contacting AWS (backend disabled).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/terraform"

cd "$TF_DIR"

echo "==> terraform init -backend=false"
terraform init -backend=false

echo ""
echo "==> terraform validate"
terraform validate

echo ""
echo "OK: terraform validate passed"
