#!/usr/bin/env bash
# Tear down LocalStack-managed resources.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/terraform"
VAR_FILE="$TF_DIR/terraform.tfvars.example"

cd "$TF_DIR"

terraform destroy -var-file="$VAR_FILE" -auto-approve
