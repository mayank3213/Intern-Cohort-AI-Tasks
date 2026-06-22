# D4 — Kubernetes Manifests (60 min)

Deploy the **existing D3 echo FastAPI service** to a local **kind** cluster using Kubernetes manifests. No new application code — reuse `tasks/Infra and DevOps/D3/service` Docker image.

## Architecture

```
curl → port-forward → Service (ClusterIP) → Deployment → D3 echo API (:8080)
                              ↑
                         ConfigMap (LOG_LEVEL, APP_NAME)
```

Optional: `Ingress` (`echo.local`) when ingress-nginx is installed on kind.

## Pass criteria

- [ ] `k8s/` contains ConfigMap, Deployment, Service (and optional Ingress)
- [ ] `kubectl apply --dry-run=client` exits **0**
- [ ] kind cluster running with image loaded from D3 service
- [ ] `/health` returns `{"status":"ok"}` via port-forward
- [ ] ConfigMap keys visible in pod env (`LOG_LEVEL`, `APP_NAME`)
- [ ] README documents up, verify, and teardown

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Docker](https://docs.docker.com/get-docker/) | Build echo image |
| [kind](https://kind.sigs.k8s.io/) | Local Kubernetes cluster |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | Apply manifests |
| `curl` | HTTP verification |

## Layout

```
D4/
├── README.md
├── kind-config.yaml           # kind cluster with ingress-ready node label
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── deployment.yaml        # image: d4-echo-api:1.0.0 (built from D3)
│   ├── service.yaml
│   └── ingress.yaml           # optional
└── scripts/
    ├── cluster-up.sh          # kind create + docker build + kind load
    ├── deploy.sh              # dry-run + apply + rollout wait
    ├── verify.sh              # port-forward + curl /health
    ├── dry-run.sh             # client dry-run only
    └── teardown.sh            # delete resources + kind cluster
```

## Image reuse

The container image is built from **D3** (same pattern as D5 echo API):

```text
tasks/Infra and DevOps/D3/service/
├── Dockerfile
├── app/main.py    # GET /health, GET /echo/{message}
└── requirements.txt
```

Image tag: `d4-echo-api:1.0.0` (loaded into kind with `imagePullPolicy: Never`).

## Quick start (full flow)

From this directory:

```bash
chmod +x scripts/*.sh
./scripts/cluster-up.sh
./scripts/deploy.sh
./scripts/verify.sh
```

Expected verify output includes:

```json
{"status":"ok"}
```

## Step-by-step

### 1. Dry-run only (no cluster)

Requires `kubectl` only (uses client-side validation):

```bash
./scripts/dry-run.sh
```

Or during deploy (always runs dry-run first):

```bash
./scripts/deploy.sh
```

### 2. Create kind cluster and load image

```bash
./scripts/cluster-up.sh
```

This:

1. Creates kind cluster `d4-echo` (skips if already exists)
2. Builds `d4-echo-api:1.0.0` from `../D3/service`
3. Loads the image into kind nodes

### 3. Deploy manifests

```bash
./scripts/deploy.sh
```

Applies namespace, ConfigMap, Deployment, Service. Waits for rollout.

To include Ingress (requires ingress-nginx):

```bash
DEPLOY_INGRESS=true ./scripts/deploy.sh
```

### 4. Verify

```bash
./scripts/verify.sh
```

- Confirms `LOG_LEVEL` and `APP_NAME` env vars from ConfigMap
- Port-forwards `svc/d4-echo-api` to localhost `18080`
- Curls `/health` and `/echo/d4-k8s`

### 5. Teardown

```bash
./scripts/teardown.sh
```

Deletes Kubernetes resources and the kind cluster.

## Manual commands

```bash
kubectl apply --dry-run=client -f k8s/
kubectl get all -n d4-echo
kubectl logs -n d4-echo -l app=d4-echo-api
kubectl port-forward -n d4-echo svc/d4-echo-api 8080:80
curl -s http://127.0.0.1:8080/health
```

## Optional: Ingress on kind

Install ingress-nginx for kind, then deploy with ingress:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
DEPLOY_INGRESS=true ./scripts/deploy.sh
echo "127.0.0.1 echo.local" | sudo tee -a /etc/hosts
curl -s http://echo.local/health
```

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `KIND_CLUSTER_NAME` | `d4-echo` | cluster-up, teardown |
| `D4_IMAGE` | `d4-echo-api:1.0.0` | cluster-up build/load |
| `DEPLOY_INGRESS` | `false` | deploy.sh |
| `LOCAL_PORT` | `18080` | verify.sh |

## Agent workflow

For AI-assisted runs, see [`k8s-manifests-agent.md`](k8s-manifests-agent.md).

Captured run output: [`k8s-run-d4-demo.md`](k8s-run-d4-demo.md).
