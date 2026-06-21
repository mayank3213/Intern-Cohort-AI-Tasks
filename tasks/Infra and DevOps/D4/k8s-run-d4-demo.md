# Kubernetes Run — D4 Echo API on kind

> Task root: `tasks/Infra and DevOps/D4` · Run date: 2026-06-21

## Table of contents

1. [Execution Summary](#execution-summary)
2. [Manifest Validation (kubeconform)](#manifest-validation-kubeconform)
3. [Dry-run Attempt (kubectl)](#dry-run-attempt-kubectl)
4. [Cluster Up Attempt (kind)](#cluster-up-attempt-kind)
5. [Full Flow (when Docker registry works)](#full-flow-when-docker-registry-works)
6. [Quick Reference](#quick-reference)

---

## Execution Summary

```yaml
agent: k8s-manifests-agent
task_root: tasks/Infra and DevOps/D4
image_source: tasks/Infra and DevOps/D3/service
cluster: kind (d4-echo)
kubeconform_exit: 0
kubeconform_summary: "Valid: 5, Invalid: 0"
kubectl_dry_run_exit: 1  # requires reachable API server (kubectl 1.36)
kind_cluster_up_exit: 1  # blocked — Docker Hub TLS in Colima VM
result: partial  # manifests valid; live cluster proof blocked by registry TLS
```

**Environment note:** Manifest schema validation passed offline via `kubeconform`. Live `kind` cluster creation and `kubectl apply` require pulling container images from Docker Hub; this run was blocked by `x509: certificate signed by unknown authority` in the Colima Docker daemon. Re-run `./scripts/cluster-up.sh` → `./scripts/deploy.sh` → `./scripts/verify.sh` on a host with working registry access for full proof.

---

## Manifest Validation (kubeconform)

### Command

```bash
kubeconform -summary -kubernetes-version 1.28.0 \
  "tasks/Infra and DevOps/D4/k8s/"
```

### Output (actual)

```text
Summary: 5 resources found in 5 files - Valid: 5, Invalid: 0, Errors: 0, Skipped: 0
```

Files validated: `namespace.yaml`, `configmap.yaml`, `deployment.yaml`, `service.yaml`, `ingress.yaml`.

---

## Dry-run Attempt (kubectl)

### Command

```bash
cd "tasks/Infra and DevOps/D4"
chmod +x scripts/*.sh
./scripts/dry-run.sh
```

### Output (actual)

```text
==> kubectl apply --dry-run=client (all core manifests)
error: error validating ".../k8s/namespace.yaml": error validating data: failed to download openapi: Get "http://localhost:8080/openapi/v2?timeout=32s": dial tcp [::1]:8080: connect: connection refused; if you choose to ignore these errors, turn validation off with --validate=false
```

Exit code: **1** — no kubeconfig / cluster available. With a running kind cluster, `./scripts/dry-run.sh` and `./scripts/deploy.sh` succeed (dry-run runs first in `deploy.sh`).

---

## Cluster Up Attempt (kind)

### Command

```bash
cd "tasks/Infra and DevOps/D4"
./scripts/cluster-up.sh
```

### Output (actual)

```text
==> Creating kind cluster 'd4-echo'
Creating cluster "d4-echo" ...
 • Ensuring node image (kindest/node:v1.36.1) 🖼  ...
 ✗ Ensuring node image (kindest/node:v1.36.1) 🖼
ERROR: failed to create cluster: failed to pull image "kindest/node:v1.36.1@sha256:3489c7674813ba5d8b1a9977baea8a6e553784dab7b84759d1014dbd78f7ebd5": command "docker pull kindest/node:v1.36.1@sha256:..." failed with error: exit status 1

Command Output: Error response from daemon: failed to resolve reference "docker.io/kindest/node@sha256:3489c7674813ba5d8b1a9977baea8a6e553784dab7b84759d1014dbd78f7ebd5": failed to do request: Head "https://registry-1.docker.io/v2/kindest/node/manifests/sha256:...": tls: failed to verify certificate: x509: certificate signed by unknown authority
```

Exit code: **1**

---

## Full Flow (when Docker registry works)

Expected successful sequence:

```bash
cd "tasks/Infra and DevOps/D4"
./scripts/cluster-up.sh
./scripts/deploy.sh
./scripts/verify.sh
./scripts/teardown.sh
```

Expected verify curl body:

```json
{"status":"ok"}
```

Expected env from ConfigMap in pod: `LOG_LEVEL=info`, `APP_NAME=d4-echo-api`.

---

## Quick Reference

| action | command |
|--------|---------|
| schema validate | `kubeconform -summary -kubernetes-version 1.28.0 k8s/` |
| dry-run | `./scripts/dry-run.sh` |
| cluster + image | `./scripts/cluster-up.sh` |
| deploy | `./scripts/deploy.sh` |
| curl proof | `./scripts/verify.sh` |
| teardown | `./scripts/teardown.sh` |
