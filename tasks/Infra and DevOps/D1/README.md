# D1 — Terraform Small Service (60 min)

Author **Terraform** for a small AWS HTTP API: **S3 bucket + Lambda + API Gateway HTTP API + IAM**. Prove `terraform validate` passes and produce a clean `terraform plan` using **LocalStack** (no real AWS spend).

## Architecture

```
HTTP client → API Gateway (HTTP API) → Lambda (Python) → S3 bucket (artifacts)
                     ↑
              IAM execution role
```

## Pass criteria

- [ ] `.tf` files present under `terraform/` with provider, variables, and outputs
- [ ] `terraform validate` exits **0** (works offline — no AWS required)
- [ ] `terraform plan` against LocalStack shows **~10 resources to add**, no errors
- [ ] README documents init → validate → plan → apply → destroy
- [ ] `.gitignore` excludes state and secrets

## Prerequisites

| Tool | Version | Required for |
|------|---------|--------------|
| [Terraform](https://developer.hashicorp.com/terraform/install) | >= 1.5 | validate, plan, apply |
| [Docker](https://docs.docker.com/get-docker/) | 24+ | LocalStack only |
| `curl` | any | health check |

## Layout

```
D1/
├── README.md
├── docker-compose.localstack.yml
├── terraform/
│   ├── versions.tf          # terraform + providers + local backend
│   ├── providers.tf         # AWS provider (LocalStack endpoints when enabled)
│   ├── variables.tf
│   ├── main.tf              # S3, Lambda, API GW, IAM
│   ├── outputs.tf
│   ├── lambda/handler.py
│   └── terraform.tfvars.example
└── scripts/
    ├── validate.sh
    ├── plan-localstack.sh
    ├── apply-localstack.sh
    └── destroy-localstack.sh
```

## Quick start (validate only — no Docker)

From this directory:

```bash
chmod +x scripts/*.sh
./scripts/validate.sh
```

Expected: `Success! The configuration is valid.`

## Full flow (LocalStack — no AWS account)

### 1. Start LocalStack

```bash
docker compose -f docker-compose.localstack.yml up -d
curl -s http://localhost:4566/_localstack/health
```

### 2. Init and validate

```bash
cd terraform
terraform init
terraform validate
```

Or from `D1/` root: `./scripts/validate.sh` (uses `-backend=false` for offline validate).

### 3. Plan

```bash
./scripts/plan-localstack.sh
```

Uses `terraform/terraform.tfvars.example` with `use_localstack = true`.

Expected plan summary (approximate):

```text
Plan: 10 to add, 0 to change, 0 to destroy.
```

Resources: S3 bucket, IAM role + inline policy, Lambda function, API Gateway API + integration + 2 routes + stage, Lambda permission, plus the `archive_file` data source (not counted as managed resource).

### 4. Apply (optional, LocalStack only)

```bash
./scripts/apply-localstack.sh
```

After apply, note the `api_invoke_url` output:

```bash
cd terraform
terraform output api_invoke_url
curl -s "$(terraform output -raw api_invoke_url)"
```

### 5. Destroy

```bash
./scripts/destroy-localstack.sh
```

### 6. Stop LocalStack

```bash
docker compose -f docker-compose.localstack.yml down
```

## Real AWS (optional — may incur cost)

Copy and edit variables:

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Set use_localstack = false and configure AWS credentials (env or ~/.aws/credentials)
```

Then:

```bash
cd terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
terraform destroy -var-file=terraform.tfvars
```

Never commit `terraform.tfvars` — it is gitignored.

## Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `aws_region` | `us-east-1` | Provider region |
| `name_prefix` | `d1-small-api` | Resource name prefix |
| `environment` | `dev` | Tag value |
| `use_localstack` | `false` | Route provider to LocalStack |
| `localstack_endpoint` | `http://localhost:4566` | LocalStack edge URL |

## Outputs

| Output | Description |
|--------|-------------|
| `s3_bucket_name` | Artifact bucket |
| `lambda_function_name` | Lambda handler name |
| `api_invoke_url` | HTTP API base URL |
| `iam_role_name` | Lambda execution role |

## Agent workflow

For AI-assisted runs, see [`terraform-small-service-agent.md`](terraform-small-service-agent.md).

Captured run output: [`terraform-run-d1-aws-demo.md`](terraform-run-d1-aws-demo.md).
