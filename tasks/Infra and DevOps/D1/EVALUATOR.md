# D1 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Stack profile

| Field | Value |
|-------|-------|
| Profile | AWS (`aws-small-api`) |
| Task root | `tasks/Infra and DevOps/D1` |
| Terraform root module | `terraform/` |

## Expected managed resources (plan)

On a **fresh** LocalStack plan (`use_localstack = true`), expect **10 resources to add**:

| # | Resource type | Purpose |
|---|---------------|---------|
| 1 | `aws_s3_bucket` | Artifact / app data bucket |
| 2 | `aws_iam_role` | Lambda execution role |
| 3 | `aws_iam_role_policy` | Logs + S3 access for Lambda |
| 4 | `aws_lambda_function` | Python HTTP handler |
| 5 | `aws_apigatewayv2_api` | HTTP API entry point |
| 6 | `aws_apigatewayv2_integration` | Lambda proxy integration |
| 7 | `aws_apigatewayv2_route` | `ANY /{proxy+}` |
| 8 | `aws_apigatewayv2_route` | `ANY /` (root) |
| 9 | `aws_apigatewayv2_stage` | `$default` stage with auto-deploy |
| 10 | `aws_lambda_permission` | Allow API Gateway invoke |

**Data source (not counted in plan add):** `archive_file.lambda_zip`

## Verification commands

### Validate (must pass without AWS or Docker)

```bash
cd "tasks/Infra and DevOps/D1"
chmod +x scripts/*.sh
./scripts/validate.sh
# Expected exit 0, output contains: Success! The configuration is valid.
```

### Plan (requires LocalStack)

```bash
docker compose -f docker-compose.localstack.yml up -d
./scripts/plan-localstack.sh
# Expected exit 0, summary: Plan: 10 to add, 0 to change, 0 to destroy.
```

## Pass criteria

- [ ] `terraform/` contains `versions.tf`, `providers.tf`, `variables.tf`, `main.tf`, `outputs.tf`
- [ ] S3 + Lambda + API Gateway + IAM present (not GCP-only)
- [ ] `terraform validate` exit 0 via `./scripts/validate.sh`
- [ ] `terraform plan` exit 0 against LocalStack with ~10 adds
- [ ] README documents init, validate, plan, apply, destroy
- [ ] `.gitignore` excludes `.terraform/`, `*.tfstate*`, `terraform.tfvars`
- [ ] No secrets committed in `.tf` files

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| validate fails on provider | Missing `terraform init -backend=false` |
| plan fails connection refused | LocalStack not running on `:4566` |
| plan shows 0 to add after prior apply | State already applied — run `destroy-localstack.sh` first |
| S3 bucket name conflict on re-apply | Leftover LocalStack state — destroy or change `name_prefix` |

## Optional apply smoke (LocalStack)

```bash
./scripts/apply-localstack.sh
cd terraform && curl -s "$(terraform output -raw api_invoke_url)"
# Expected JSON body with "message":"d1-small-api ok"
./scripts/destroy-localstack.sh
```
