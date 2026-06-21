#!/usr/bin/env bash
# Plan against LocalStack (no real AWS spend). Requires LocalStack on localhost:4566.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/terraform"
VAR_FILE="$TF_DIR/terraform.tfvars.example"

cd "$ROOT"

if ! curl -sf "http://localhost:4566/_localstack/health" >/dev/null 2>&1; then
  echo "LocalStack is not running on :4566."
  echo "Start it from this directory:"
  echo "  docker compose -f docker-compose.localstack.yml up -d"
  exit 1
fi

cd "$TF_DIR"

echo "==> terraform init"
terraform init

echo ""
echo "==> terraform plan (LocalStack)"
terraform plan \
  -var-file="$VAR_FILE" \
  -input=false \
  -out=tfplan.localstack

echo ""
echo "OK: terraform plan completed (saved to terraform/tfplan.localstack)"
echo "Apply (optional, LocalStack only): terraform apply tfplan.localstack"
echo "Destroy (optional): terraform destroy -var-file=$VAR_FILE"
