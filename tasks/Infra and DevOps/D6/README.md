# D6 — Observability Stack (60 min)

Instrument a **D5-style echo FastAPI service** with **structlog JSON logs** and **Prometheus metrics**, then run **Prometheus + Grafana** via Docker Compose. Generate traffic and prove metrics appear in Grafana.

## Architecture

```
load.sh → app (:8080) → JSON logs (stdout)
              ↑
         /metrics ← prometheus (:9090) → grafana (:3000)
```

## Pass criteria

- [ ] `GET /metrics` exposes `http_requests_total` and `http_request_duration_seconds`
- [ ] Prometheus scrape target `job=app` is **UP**
- [ ] After load, `sum(rate(http_requests_total[1m]))` > 0
- [ ] Grafana dashboard **HTTP Request Rate** panel shows live data
- [ ] Stdout logs are **one JSON object per line** with `timestamp`, `level`, `message`

## Prerequisites

- Docker 24+ with Compose v2
- `curl`
- `python3` (for verify script JSON parsing)
- Optional: `hey` or `ab` for heavier load (`load.sh` falls back to curl loop)

## Layout

```
D6/
├── README.md
├── EVALUATOR.md
├── service/                         # D5 echo + structlog + prometheus_client
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/main.py
├── observability/
│   ├── docker-compose.yml           # app + prometheus + grafana
│   ├── prometheus.yml
│   └── grafana/
│       ├── provisioning/datasources/prometheus.yml
│       ├── provisioning/dashboards/default.yml
│       └── dashboards/app-overview.json
└── scripts/
    ├── obs-up.sh
    ├── obs-down.sh
    ├── load.sh
    └── verify-metrics.sh
```

## Run order

From this directory:

```bash
chmod +x scripts/*.sh
./scripts/obs-up.sh
./scripts/load.sh
sleep 20    # allow Prometheus to scrape after load
./scripts/verify-metrics.sh
```

### URLs

| Service | URL | Notes |
|---------|-----|-------|
| App | http://127.0.0.1:8080/health | Echo API |
| Metrics | http://127.0.0.1:8080/metrics | Prometheus text format |
| Prometheus | http://127.0.0.1:9090 | Targets UI |
| Grafana | http://127.0.0.1:3000 | `admin` / `admin` |

Grafana dashboard: **D6 Echo API Overview** → panel **HTTP Request Rate**

PromQL: `sum(rate(http_requests_total[1m]))`

## Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | counter | `method`, `path`, `status` |
| `http_request_duration_seconds` | histogram | `method`, `path` |

Path labels are normalized (`/echo/foo` → `/echo/{message}`) to limit cardinality.

## Structured logging

Each request logs one JSON line to stdout, for example:

```json
{
  "timestamp": "2025-06-17T12:00:00.123456Z",
  "level": "info",
  "message": "request_completed",
  "method": "GET",
  "path": "/echo/hello",
  "status_code": 200,
  "duration_ms": 1.23,
  "request_id": "a1b2c3d4"
}
```

404 responses (e.g. `/not-found` during load) log at **warning** level.

View logs:

```bash
docker logs d6-echo-app 2>&1 | tail -5
docker logs d6-echo-app 2>&1 | tail -1 | python3 -m json.tool
```

## Manual verification

```bash
# Prometheus target UP
curl -s http://127.0.0.1:9090/api/v1/targets | python3 -m json.tool

# Request rate query
curl -s --get 'http://127.0.0.1:9090/api/v1/query' \
  --data-urlencode 'query=sum(rate(http_requests_total[1m]))'

# Grafana datasource
curl -s -u admin:admin http://127.0.0.1:3000/api/datasources/name/Prometheus
```

## Teardown

```bash
./scripts/obs-down.sh
```

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `APP_BASE_URL` | `http://127.0.0.1:8080` | load.sh, verify-metrics.sh |
| `PROMETHEUS_URL` | `http://127.0.0.1:9090` | verify-metrics.sh |
| `GRAFANA_URL` | `http://127.0.0.1:3000` | verify-metrics.sh |
| `LOAD_REQUESTS` | `120` | load.sh (curl fallback) |
| `LOAD_CONCURRENCY` | `4` | load.sh |

## Agent workflow

For AI-assisted runs, see [`observability-stack-agent.md`](observability-stack-agent.md).

Captured run output: [`obs-run-d6-demo.md`](obs-run-d6-demo.md).

## Evaluator

Graders: see [`EVALUATOR.md`](EVALUATOR.md) *(do not share with candidates during eval)*.
