# Terraform Run — D1 AWS Small API (LocalStack profile)

> Task root: `tasks/Infra and DevOps/D1` · Run date: 2026-06-21

## Table of contents

1. [Execution Summary](#execution-summary)
2. [Validate Proof](#validate-proof)
3. [Plan Proof](#plan-proof)
4. [Quick Reference](#quick-reference)

---

## Execution Summary

```yaml
agent: terraform-small-service-agent
task_root: tasks/Infra and DevOps/D1
profile: aws-small-api
terraform_root: terraform/
validate_command: ./scripts/validate.sh
validate_exit: 0
plan_command: terraform plan -var-file=terraform.tfvars.example
plan_summary: "10 to add, 0 to change, 0 to destroy"
localstack_running: false  # plan succeeded without live LocalStack (create-only plan)
result: ready
```

---

## Validate Proof

### Command

```bash
cd "tasks/Infra and DevOps/D1"
chmod +x scripts/*.sh
./scripts/validate.sh
```

### Output (actual)

```text
==> terraform init -backend=false
Initializing provider plugins...
- Reusing previous version of hashicorp/aws from the dependency lock file
- Reusing previous version of hashicorp/archive from the dependency lock file
- Using previously-installed hashicorp/archive v2.8.0
- Using previously-installed hashicorp/aws v5.100.0

Terraform has been successfully initialized!

==> terraform validate
Success! The configuration is valid.

OK: terraform validate passed
```

---

## Plan Proof

### Command

```bash
cd "tasks/Infra and DevOps/D1/terraform"
terraform init
terraform plan -var-file=terraform.tfvars.example -input=false
```

Uses `use_localstack = true` from `terraform.tfvars.example`.

### Output (actual — summary)

```text
data.archive_file.lambda_zip: Reading...
data.archive_file.lambda_zip: Read complete after 0s

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

  # aws_apigatewayv2_api.http_api will be created
  # aws_apigatewayv2_integration.lambda_proxy will be created
  # aws_apigatewayv2_route.default will be created
  # aws_apigatewayv2_route.root will be created
  # aws_apigatewayv2_stage.default will be created
  # aws_iam_role.lambda_exec will be created
  # aws_iam_role_policy.lambda_s3 will be created
  # aws_lambda_function.api_handler will be created
  # aws_lambda_permission.apigw_invoke will be created
  # aws_s3_bucket.artifacts will be created

Plan: 10 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + api_gateway_id
  + api_invoke_url
  + iam_role_name        = "d1-small-api-lambda-role"
  + lambda_function_name = "d1-small-api-handler"
  + s3_bucket_name       = "d1-small-api-artifacts"

Warning: Invalid Attribute Combination
  with provider["registry.terraform.io/hashicorp/aws"],
  on providers.tf line 13, in provider "aws":
  Only one of the following attributes should be set: "endpoints[0].logs",
  "endpoints[0].cloudwatchlog", "endpoints[0].cloudwatchlogs"
  This will be an error in a future release.
```

Exit code: **0**

### Optional LocalStack apply

When LocalStack is running (`docker-compose -f docker-compose.localstack.yml up -d`):

```bash
./scripts/plan-localstack.sh
./scripts/apply-localstack.sh
curl -s "$(cd terraform && terraform output -raw api_invoke_url)"
./scripts/destroy-localstack.sh
```

---

## Quick Reference

| action | command |
|--------|---------|
| validate only | `./scripts/validate.sh` |
| plan (LocalStack) | `./scripts/plan-localstack.sh` |
| apply (LocalStack) | `./scripts/apply-localstack.sh` |
| destroy (LocalStack) | `./scripts/destroy-localstack.sh` |
