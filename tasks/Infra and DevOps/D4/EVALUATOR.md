# D4 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Target

| Field | Value |
|-------|-------|
| Task root | `tasks/Infra and DevOps/D4` |
| App source (image build) | `tasks/Infra and DevOps/D3/service` |
| Cluster | kind (`d4-echo`) |
| Namespace | `d4-echo` |

## Expected Kubernetes resources

| Resource | Name | Required |
|----------|------|----------|
| Namespace | `d4-echo` | yes |
| ConfigMap | `d4-echo-config` | yes |
| Deployment | `d4-echo-api` | yes |
| Service | `d4-echo-api` (ClusterIP) | yes |
| Ingress | `d4-echo-api` | optional |

### ConfigMap keys (must be consumed via envFrom)

- `LOG_LEVEL=info`
- `APP_NAME=d4-echo-api`

### Deployment contract

- Image: `d4-echo-api:1.0.0` built from D3 Dockerfile
- `imagePullPolicy: Never` (kind-loaded image)
- Readiness + liveness probes on `/health` port `8080`
- Resource requests/limits set

## Verification commands

### Dry-run (must pass)

```bash
cd "tasks/Infra and DevOps/D4"
chmod +x scripts/*.sh
./scripts/dry-run.sh
# Expected exit 0
```

### Full local proof

```bash
./scripts/cluster-up.sh
./scripts/deploy.sh
./scripts/verify.sh
# Expected: {"status":"ok"} from /health
# Expected: LOG_LEVEL and APP_NAME in pod env
```

### Teardown

```bash
./scripts/teardown.sh
```

## Pass criteria

- [ ] `k8s/configmap.yaml`, `deployment.yaml`, `service.yaml` present
- [ ] Deployment references ConfigMap via `envFrom`
- [ ] HTTP probes on `/health`
- [ ] `kubectl apply --dry-run=client` exit 0
- [ ] kind cluster deploys and `/health` returns ok
- [ ] No new application — image built from D3 service path
- [ ] README documents cluster-up → deploy → verify → teardown

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| `ErrImageNeverPull` / ImagePullBackOff | Image not loaded — run `cluster-up.sh` |
| dry-run fails | Invalid YAML or wrong apiVersion |
| verify curl timeout | Rollout not ready — check `kubectl get pods -n d4-echo` |
| port-forward in use | Change `LOCAL_PORT=18081 ./scripts/verify.sh` |
| ingress curl fails | ingress-nginx not installed or `/etc/hosts` missing `echo.local` |

## Optional ingress check

```bash
DEPLOY_INGRESS=true ./scripts/deploy.sh
curl -s http://echo.local/health   # after ingress-nginx + /etc/hosts
```
