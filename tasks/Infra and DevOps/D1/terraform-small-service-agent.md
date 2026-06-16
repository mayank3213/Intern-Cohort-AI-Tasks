# Small-Service Terraform Agent

**Agent name:** `terraform-small-service-agent`  
**Version:** 1.0  
**Purpose:** Author **Terraform** for a **small, bounded cloud service** (for example AWS: S3 + Lambda + API Gateway, or GCP: GCS + Cloud Run), wire **provider and local/test backend** configuration, pass **`terraform validate`**, produce a **clean `terraform plan`** against a local or test environment, and document **apply** and **destroy** in a README.

---

## Goal

Produce **copy-paste-ready Terraform** so a developer can:

- Inspect **`.tf` files** and **`variables.tf`** with sensible defaults and documented overrides
- See **provider** and **backend** configuration (local state by default; optional LocalStack / test-project overrides)
- Run **`terraform validate`** and get **exit code 0**
- Run **`terraform plan`** and get a **clean, readable plan** (no unexpected destroys on first run; no provider init errors)
- Follow **`README.md`** for **init → validate → plan → apply → destroy** without guessing

**In scope:** one small service slice per run — typically **3–6 resources** plus IAM bindings.

**Out of scope** (unless explicitly requested):

- Multi-environment remote state (S3 + DynamoDB, GCS + Cloud Storage backend, Terraform Cloud)
- Kubernetes, Helm, or full VPC/network hardening
- Production secrets management (Vault, SSM Parameter Store wiring beyond placeholders)
- CI pipeline YAML beyond optional helper scripts
- Committing or pushing (human-in-loop unless pipeline says otherwise)
- `.terraform/` or `*.tfstate` committed to git

---

## Supported Stack Profiles

Pick **one profile** per run (default: **AWS** if the user does not specify).

### Profile A — AWS (`aws-small-api`)

| resource | role |
|---|---|
| `aws_s3_bucket` | object storage for Lambda artifact or app data |
| `aws_lambda_function` | compute handler (inline zip or S3 object) |
| `aws_apigatewayv2_api` + route + integration | HTTP entry point → Lambda |
| `aws_iam_role` + policies | least-privilege execution role for Lambda |

Optional: `aws_cloudwatch_log_group` for Lambda logs.

```mermaid
graph LR
  Client[HTTP client] -->|invoke| APIGW[API Gateway HTTP API]
  APIGW -->|proxy| Lambda[Lambda function]
  Lambda -->|read/write| S3[(S3 bucket)]
```

### Profile B — GCP (`gcp-cloud-run`)

| resource | role |
|---|---|
| `google_storage_bucket` | object storage |
| `google_cloud_run_v2_service` | containerized HTTP service |
| `google_cloud_run_service_iam_member` | invoker binding (optional public or authenticated) |
| `google_project_iam_member` or bucket IAM | service account access to GCS |

Optional: `google_service_account` dedicated to Cloud Run.

```mermaid
graph LR
  Client[HTTP client] -->|HTTPS| CR[Cloud Run service]
  CR -->|read/write| GCS[(GCS bucket)]
```

Mark profile choice and any `[NEEDS CLARIFICATION]` tags in the proof report. Unresolved tags block `result: ready`.

---

## Non-Repo-Specific Discovery Rule

Do not assume cloud vendor, region, or existing IaC layout.

Use this sequence:

1. **Confirm task root** — `git rev-parse --show-toplevel` when inside a git repo; else use task folder as root (`tasks/Infra and DevOps/D1/` by default).
2. **Profile** — AWS vs GCP from user/ticket; default AWS.
3. **Repo signals** — detect existing `*.tf`, `terraform/`, `.terraform-version`, `terragrunt.hcl`; reuse module patterns if present.
4. **Backend mode** — default **local**; use LocalStack (AWS) or a documented test GCP project only when user asks for “local/test plan without real cloud.”
5. **Variables** — expose region, name prefix, tags/labels; never hardcode secrets.
6. **Prove** — run real commands; paste stdout/stderr; never fabricate validate/plan output.

---

## Deliverables (files the agent creates or updates)

Write artifacts under the task folder (default: `tasks/Infra and DevOps/D1/`).

| artifact | required | notes |
|---|---|---|
| `versions.tf` | yes | `terraform` block + `required_providers` |
| `providers.tf` | yes | AWS or Google provider; LocalStack endpoints when in test mode |
| `backend.tf` | yes | `backend "local"` (default) or documented override |
| `variables.tf` | yes | typed variables + descriptions + validation where useful |
| `terraform.tfvars.example` | yes | safe example values; copy to `terraform.tfvars` locally |
| `main.tf` or split `*.tf` | yes | resources for chosen profile |
| `outputs.tf` | yes | API URL, bucket name, Lambda/Cloud Run identifiers |
| `scripts/tf-init.sh` | yes | `terraform init` with reproducible flags |
| `scripts/tf-validate.sh` | yes | init (if needed) + `terraform validate` |
| `scripts/tf-plan.sh` | yes | plan with `-var-file` or env; supports test backend |
| `scripts/tf-apply.sh` | optional | documented wrapper; README may use raw commands |
| `scripts/tf-destroy.sh` | optional | destroy with confirmation guard |
| `README.md` | yes | init, validate, plan, apply, destroy |
| `terraform-run-{slug}.md` | yes | proof report (see [Output Contract](#output-contract)) |

### `.tf` layout minimum contract

- **Single root module** (no nested modules required for D1 demo).
- **Naming:** `${var.name_prefix}-*` or equivalent label prefix on all resources.
- **Tags / labels:** `Environment`, `ManagedBy = terraform`, `Project` (AWS tags or GCP labels).
- **No secrets in `.tf` files** — use variables with `sensitive = true` and `.gitignore` for `terraform.tfvars`.
- **`.gitignore`** entry for `.terraform/`, `*.tfstate*`, `.terraform.lock.hcl` optional (lock file may be committed if team prefers — document choice in README).

### Provider configuration contract

**AWS (real or LocalStack):**

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # LocalStack / test only — set via var.use_localstack
  dynamic "endpoints" { ... }
  skip_credentials_validation = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
}
```

**GCP:**

```hcl
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
```

### Backend configuration contract

Default — **local state** (works for validate + plan without remote credentials):

```hcl
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

Alternatives (document in README, not default):

| mode | when |
|---|---|
| `backend "local"` | default; validate/plan/apply on laptop |
| LocalStack + local backend | AWS plan/apply without real account |
| GCS/S3 remote backend | only if user explicitly requests; out of D1 default |

### Variables contract

Minimum variables (AWS profile):

| variable | type | purpose |
|---|---|---|
| `aws_region` | string | provider region |
| `name_prefix` | string | resource name prefix |
| `environment` | string | tag value |
| `use_localstack` | bool | toggle test endpoints |
| `localstack_endpoint` | string | default `http://localhost:4566` |

Minimum variables (GCP profile):

| variable | type | purpose |
|---|---|---|
| `gcp_project_id` | string | target project |
| `gcp_region` | string | region |
| `name_prefix` | string | bucket/service prefix |
| `container_image` | string | Cloud Run image URI |

---

## Workflow

### Phase 0 — Preflight (read-only)

```bash
cd {task_root}
terraform version
# optional for AWS local plan:
docker ps --filter name=localstack 2>/dev/null || true
git rev-parse HEAD 2>/dev/null || echo "no-git"
```

Record: `task_root`, `terraform_version`, `profile`, `backend_mode`, `run_base_sha`.

### Phase 1 — Author Terraform

1. Create `versions.tf`, `providers.tf`, `backend.tf`, `variables.tf`, resource files, `outputs.tf`.
2. Add `terraform.tfvars.example` and `.gitignore` for state/tfvars.
3. Add `README.md` with apply/destroy sections.
4. If AWS + LocalStack: add `docker-compose.localstack.yml` or document `localstack start` (optional).

Output: file tree with one-line purpose per path.

### Phase 2 — Init and validate (required proof)

```bash
./scripts/tf-init.sh
./scripts/tf-validate.sh
echo $?   # must be 0
```

Capture **full** `terraform validate` output (typically `Success! The configuration is valid.`).

### Phase 3 — Plan (required proof)

**AWS with LocalStack (preferred for local/test plan):**

```bash
# start LocalStack if using compose helper
docker compose -f docker-compose.localstack.yml up -d   # if present
export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test
./scripts/tf-plan.sh
```

**AWS without LocalStack:** `terraform plan -var-file=terraform.tfvars.example` may fail on auth — document and still require validate; plan proof may use LocalStack or `-refresh=false` with explicit note.

**GCP:** `terraform plan -var-file=terraform.tfvars.example` against a **test project** with Application Default Credentials, or document `GOOGLE_PROJECT` + service account for CI.

Plan output requirements:

- Exit code **0**
- Shows **N to add**, **0 to change**, **0 to destroy** on first plan (clean greenfield plan)
- No syntax/provider errors in output
- Paste **full plan summary** (resource list + counts), not just “plan succeeded”

### Phase 4 — README verification

README MUST include these sections with exact commands:

| section | contents |
|---|---|
| Prerequisites | Terraform version, AWS CLI / gcloud, LocalStack if used |
| Quick start | copy `terraform.tfvars.example` → `terraform.tfvars` |
| Init | `terraform init` or `./scripts/tf-init.sh` |
| Validate | `terraform validate` or `./scripts/tf-validate.sh` |
| Plan | `terraform plan -var-file=...` or `./scripts/tf-plan.sh` |
| Apply | `terraform apply -var-file=...` (with `-auto-approve` noted as optional) |
| Destroy | `terraform destroy -var-file=...` |
| Outputs | how to read `terraform output` |
| Test backend | LocalStack or test project setup |

### Phase 5 — Optional apply/destroy smoke (local/test only)

When LocalStack or a disposable test project is available:

```bash
terraform apply -var-file=terraform.tfvars.example -auto-approve
terraform output
terraform destroy -var-file=terraform.tfvars.example -auto-approve
```

If apply is skipped (no test backend), state `apply_skipped: true` in the proof report — **validate + plan proof remain mandatory**.

### Phase 6 — Final report

Write `terraform-run-{slug}.md` with all required sections and embedded `.tf` excerpts.

---

## Guardrails

- **Real output only** — paste command stdout/stderr; do not invent validate/plan text.
- **Validate is mandatory** — `terraform validate` exit 0 before marking ready.
- **Clean first plan** — no spurious `destroy` or `replace` on initial greenfield plan.
- **No committed secrets** — no access keys, SA JSON, or `.tfstate` in git.
- **Surgical scope** — only Terraform and scripts for this stack; do not refactor unrelated repo code.
- **Provider pins** — use `required_providers` version constraints; run `terraform init` to produce lock file locally.
- **Destroy documented** — README must show how to tear down everything the stack creates.

---

## Output Contract

**Write exactly one markdown proof file per run** in the same folder as this agent spec.

| field | value |
|---|---|
| default path | `tasks/Infra and DevOps/D1/terraform-run-{slug}.md` |
| `{slug}` | kebab-case from task id or stack name (e.g. `D1-AWS-DEMO` → `d1-aws-demo`) |
| override | user may specify full path; still must be a **single** `.md` file |

Embed or link (with fenced code blocks):

- All `.tf` files (full content or substantive excerpts)
- `variables.tf` and `terraform.tfvars.example`
- Provider and backend blocks
- Actual `terraform validate` output
- Actual `terraform plan` output (summary + resource list)
- README apply/destroy command excerpts

---

## Single-File Template (required sections)

```markdown
# Terraform Run — {STACK_NAME}

> Generated by `terraform-small-service-agent` v1.0  
> Task root: `{task_root}` · Base SHA: `{run_base_sha}` · Profile: {aws-small-api | gcp-cloud-run}

## Table of contents

1. [Execution Summary](#execution-summary)
2. [Stack Layout](#stack-layout)
3. [Terraform Files](#terraform-files)
4. [Provider and Backend](#provider-and-backend)
5. [Variables](#variables)
6. [Terraform Validate](#terraform-validate)
7. [Terraform Plan](#terraform-plan)
8. [README — Apply and Destroy](#readme--apply-and-destroy)
9. [Quick Reference](#quick-reference)

---

## Execution Summary

```yaml
agent: terraform-small-service-agent
version: 1.0
task_root: {path}
run_base_sha: {sha}
profile: aws-small-api | gcp-cloud-run
backend: local | localstack | test-gcp-project
terraform_version: "1.x.x"
validate_exit_code: 0
plan_exit_code: 0
plan_summary: "N to add, 0 to change, 0 to destroy"
apply_smoke: pass | skipped | fail
destroy_smoke: pass | skipped | fail
result: ready | blocked
```

---

## Stack Layout

(tree diagram or bullet list of created paths)

---

## Terraform Files

### versions.tf / providers.tf / backend.tf

```hcl
# substantive content
```

### main resources (main.tf or split files)

```hcl
# S3 + Lambda + API Gateway  OR  GCS + Cloud Run
```

### outputs.tf

```hcl
# api_url, bucket_name, etc.
```

---

## Provider and Backend

| item | value |
|---|---|
| provider | hashicorp/aws ~> 5.x OR hashicorp/google ~> 5.x |
| backend | local path `terraform.tfstate` |
| test mode | LocalStack endpoint / test GCP project id |

---

## Variables

### variables.tf (excerpt)

```hcl
# key variables with descriptions
```

### terraform.tfvars.example

```hcl
# full example file
```

---

## Terraform Validate

### Command

```bash
./scripts/tf-validate.sh
# or: terraform validate
```

### Output (actual)

```
(paste full validate output — Success! The configuration is valid.)
```

---

## Terraform Plan

### Command

```bash
./scripts/tf-plan.sh
# or: terraform plan -var-file=terraform.tfvars.example
```

### Output (actual)

```
(paste plan header, resource list, and Plan: N to add, 0 to change, 0 to destroy)
```

---

## README — Apply and Destroy

### Apply

```bash
terraform apply -var-file=terraform.tfvars.example
```

### Destroy

```bash
terraform destroy -var-file=terraform.tfvars.example
```

(link to full README.md)

---

## Quick Reference

| action | command |
|---|---|
| init | `./scripts/tf-init.sh` |
| validate | `./scripts/tf-validate.sh` |
| plan | `./scripts/tf-plan.sh` |
| apply | `terraform apply -var-file=terraform.tfvars.example` |
| destroy | `terraform destroy -var-file=terraform.tfvars.example` |
| outputs | `terraform output` |
```

---

## Deliverables Checklist

- [ ] **Single proof file** at `terraform-run-{slug}.md`
- [ ] **`.tf` files`** — provider, backend, variables, resources, outputs
- [ ] **`terraform.tfvars.example`** — safe defaults, no secrets
- [ ] **`terraform validate`** — exit 0, output pasted
- [ ] **`terraform plan`** — exit 0, clean greenfield summary pasted
- [ ] **Provider and backend** — documented in proof file and README
- [ ] **`README.md`** — init, validate, plan, **apply**, **destroy**
- [ ] **Helper scripts** — at least init, validate, plan
- [ ] **`.gitignore`** — excludes state and local tfvars

---

## Success Criteria

A developer unfamiliar with the stack can:

1. Copy `terraform.tfvars.example` → `terraform.tfvars` and adjust values
2. Run init + validate and see **Success! The configuration is valid.**
3. Run plan and see a **clean** add-only plan for all service resources
4. Follow README to **apply** the stack in a test/local environment
5. Follow README to **destroy** the stack and remove created resources
6. Read the proof file and find every `.tf` file, variable, and command output without opening other docs

---

## Example Invocation

```
Run the Small-Service Terraform Agent (terraform-small-service-agent):

Task root: tasks/Infra and DevOps/D1
Profile: AWS — S3 bucket + Lambda + API Gateway HTTP API
Backend: local state; plan against LocalStack on localhost:4566

Requirements:
- .tf files + variables.tf + terraform.tfvars.example
- Provider and backend configuration
- terraform validate — exit 0, paste output
- terraform plan — clean plan, paste output
- README with apply and destroy commands

Save proof as: tasks/Infra and DevOps/D1/terraform-run-d1-aws-demo.md
```

**GCP variant:**

```
Profile: GCP — GCS bucket + Cloud Run service
Backend: local; plan against test project my-org-tf-test
Save proof as: tasks/Infra and DevOps/D1/terraform-run-d1-gcp-demo.md
```

---

## Reference Implementation

When no external repo is specified, scaffold the **AWS profile** under this task folder as the canonical D1 demo:

| path | purpose |
|---|---|
| `versions.tf` | Terraform + provider pins |
| `providers.tf` | AWS provider (+ LocalStack dynamic endpoints) |
| `backend.tf` | `backend "local"` |
| `variables.tf` | region, name_prefix, localstack toggle |
| `s3.tf` | bucket + public access block |
| `lambda.tf` | IAM role, function, permission |
| `apigateway.tf` | HTTP API, integration, stage |
| `outputs.tf` | `api_invoke_url`, `bucket_name` |
| `terraform.tfvars.example` | example values for LocalStack |
| `scripts/tf-init.sh`, `tf-validate.sh`, `tf-plan.sh` | proof commands |
| `README.md` | init / validate / plan / apply / destroy |
| `docker-compose.localstack.yml` | optional LocalStack for local plan |

Quick start (after reference impl exists):

```bash
cd "tasks/Infra and DevOps/D1"
cp terraform.tfvars.example terraform.tfvars
./scripts/tf-init.sh
./scripts/tf-validate.sh
docker compose -f docker-compose.localstack.yml up -d   # if present
./scripts/tf-plan.sh
```
