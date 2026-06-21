#!/usr/bin/env bash
# Apply to LocalStack using the saved plan file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/terraform"

cd "$TF_DIR"

if [[ ! -f tfplan.localstack ]]; then
  echo "Missing tfplan.localstack — run ./scripts/plan-localstack.sh first"
  exit 1
fi

terraform apply tfplan.localstack
