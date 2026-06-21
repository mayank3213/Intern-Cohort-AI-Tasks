# D6 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Target

| Field | Value |
|-------|-------|
| Task root | `tasks/Infra and DevOps/D6` |
| Service | `service/` — D5 echo extended with structlog + prometheus_client |
| Compose | `observability/docker-compose.yml` |

## Expected stack

| Container | Port | Role |
|-----------|------|------|
| `d6-echo-app` | 8080 | Instrumented FastAPI |
| `d6-prometheus` | 9090 | Scrapes `app:8080/metrics` |
| `d6-grafana` | 3000 | Provisioned Prometheus datasource + dashboard |

## Required metrics

- `http_requests_total{method,path,status}`
- `http_request_duration_seconds_bucket` (histogram)

## Required log fields (JSON stdout)

- `timestamp` (ISO-8601 UTC)
- `level` (`info`, `warning`, `error`)
- `message` (e.g. `request_completed`, `application_started`)
- HTTP requests also include: `method`, `path`, `status_code`, `duration_ms`, `request_id`

## Verification commands

```bash
cd "tasks/Infra and DevOps/D6"
chmod +x scripts/*.sh
./scripts/obs-up.sh
./scripts/load.sh
sleep 20
./scripts/verify-metrics.sh
./scripts/obs-down.sh
```

### Expected verify output (high level)

- `http_requests_total` present on `/metrics`
- `OK: 1 app target(s) UP`
- `request rate = X.XXXX req/s` with `OK: request rate > 0`
- `OK: Grafana Prometheus datasource provisioned`
- `OK: stdout log line is valid JSON (timestamp, level, message)`

## Grafana panel

- Dashboard: **D6 Echo API Overview** (`uid: d6-echo-overview`)
- Panel: **HTTP Request Rate**
- PromQL: `sum(rate(http_requests_total[1m]))`

Manual check: open http://127.0.0.1:3000 after load — panel should show a non-flat line.

## Pass criteria

- [ ] `/metrics` endpoint returns Prometheus text format
- [ ] Prometheus scrape target `job=app` health **up**
- [ ] Request rate query returns value > 0 after `load.sh`
- [ ] Grafana datasource auto-provisioned (no manual UI setup)
- [ ] Dashboard panel queries `http_requests_total` rate
- [ ] App logs are JSON lines on stdout
- [ ] README documents run order: up → load → verify → down

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| Prometheus target down | App not healthy; check `docker compose ps` |
| Request rate 0 | Load not run, or verify run too soon (< 15s scrape interval) |
| Grafana empty panel | Time range — set Last 15 minutes; rerun load |
| Log line not JSON | structlog not configured with JSONRenderer |
| verify fails on docker logs | Container name mismatch — must be `d6-echo-app` |
