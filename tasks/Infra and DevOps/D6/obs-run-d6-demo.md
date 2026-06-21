# Observability Run — D6 Echo API + Prometheus + Grafana

> Task root: `tasks/Infra and DevOps/D6` · Run date: 2026-06-21

## Table of contents

1. [Execution Summary](#execution-summary)
2. [Service Code Diff](#service-code-diff)
3. [Local Service Proof (metrics + JSON logs)](#local-service-proof-metrics--json-logs)
4. [Compose Stack Attempt (Docker)](#compose-stack-attempt-docker)
5. [Full Stack Flow (when Docker registry works)](#full-stack-flow-when-docker-registry-works)
6. [Quick Reference](#quick-reference)

---

## Execution Summary

```yaml
agent: observability-stack-agent
task_root: tasks/Infra and DevOps/D6
service_diff_base: tasks/Infra and DevOps/D3/service/app/main.py
local_uvicorn_proof: passed
local_metrics_after_load: passed
compose_stack_exit: 1  # blocked — Docker Hub TLS in Colima VM
grafana_panel_live: skipped  # requires compose stack
result: partial  # instrumentation proven locally; Prometheus/Grafana blocked by registry TLS
```

**Environment note:** `/metrics`, structlog JSON logs, and request counters were verified by running the service locally with `uvicorn`. Full Prometheus + Grafana compose stack requires pulling images from Docker Hub; blocked by TLS in this run. Re-run `./scripts/obs-up.sh` → `./scripts/load.sh` → `./scripts/verify-metrics.sh` on a host with working registry access.

---

## Service Code Diff

Base: D3 echo API. D6 adds structlog, Prometheus metrics middleware, and `GET /metrics`.

### Command

```bash
diff -u "tasks/Infra and DevOps/D3/service/app/main.py" \
        "tasks/Infra and DevOps/D6/service/app/main.py"
```

### Diff (actual — excerpt)

```diff
--- D3/service/app/main.py
+++ D6/service/app/main.py
@@ -1,8 +1,110 @@
-from fastapi import FastAPI
+import time
+import uuid
+from contextlib import asynccontextmanager
+
+import structlog
+from fastapi import FastAPI, Request
+from fastapi.responses import PlainTextResponse
+from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
+from starlette.middleware.base import BaseHTTPMiddleware
+
+SERVICE_NAME = "d6-echo-api"
+...
+REQUEST_COUNT = Counter("http_requests_total", ...)
+REQUEST_LATENCY = Histogram("http_request_duration_seconds", ...)
+...
+app.add_middleware(ObservabilityMiddleware)
 ...
+@app.get("/metrics")
+def metrics() -> PlainTextResponse:
+    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

Full file: `service/app/main.py` (121 lines).

---

## Local Service Proof (metrics + JSON logs)

Run without Docker to prove instrumentation.

### Command

```bash
cd "tasks/Infra and DevOps/D6/service"
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8080 &
sleep 2
curl -s http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/metrics | grep '^http_requests_total' | head -5
for i in $(seq 1 30); do curl -sf "http://127.0.0.1:8080/echo/load-$i" >/dev/null; done
curl -s http://127.0.0.1:8080/metrics | grep '^http_requests_total'
```

### Output (actual)

```text
==> health
{"status":"ok"}

==> metrics sample
http_requests_total{method="GET",path="/health",status="200"} 2.0
http_request_duration_seconds_bucket{le="0.005",method="GET",path="/health"} 2.0
...

==> metrics after load
http_requests_total{method="GET",path="/health",status="200"} 2.0
http_requests_total{method="GET",path="/metrics",status="200"} 1.0
http_requests_total{method="GET",path="/echo/{message}",status="200"} 30.0
http_requests_total{method="GET",path="/not-found",status="404"} 30.0
```

### JSON log line (actual)

```json
{
  "method": "GET",
  "path": "/metrics",
  "status_code": 200,
  "duration_ms": 0.89,
  "request_id": "7cf7da17",
  "level": "info",
  "timestamp": "2026-06-21T09:14:18.723864Z",
  "message": "request_completed"
}
```

Startup log (actual):

```json
{
  "service": "d6-echo-api",
  "version": "1.0.0",
  "port": 8080,
  "level": "info",
  "timestamp": "2026-06-21T09:13:51.675375Z",
  "message": "application_started"
}
```

---

## Compose Stack Attempt (Docker)

### Command

```bash
cd "tasks/Infra and DevOps/D6/observability"
docker-compose up --build -d
```

### Output (actual)

```text
 Image prom/prometheus:v2.55.1 Pulling
 Image grafana/grafana:11.3.0 Pulling
 Image prom/prometheus:v2.55.1 Error failed to resolve reference "docker.io/prom/prometheus:v2.55.1": ... tls: failed to verify certificate: x509: certificate signed by unknown authority
 Image grafana/grafana:11.3.0 Interrupted
Error response from daemon: failed to resolve reference "docker.io/prom/prometheus:v2.55.1": ... tls: failed to verify certificate: x509: certificate signed by unknown authority
```

Exit code: **1**

---

## Full Stack Flow (when Docker registry works)

```bash
cd "tasks/Infra and DevOps/D6"
chmod +x scripts/*.sh
./scripts/obs-up.sh
./scripts/load.sh
sleep 20
./scripts/verify-metrics.sh
./scripts/obs-down.sh
```

Expected from `verify-metrics.sh`:

```text
OK: 1 app target(s) UP
request rate = X.XXXX req/s
OK: request rate > 0
OK: Grafana Prometheus datasource provisioned
OK: stdout log line is valid JSON (timestamp, level, message)
OK: observability verification passed
```

Grafana panel **HTTP Request Rate** — PromQL: `sum(rate(http_requests_total[1m]))`

---

## Quick Reference

| action | command |
|--------|---------|
| up stack | `./scripts/obs-up.sh` |
| generate traffic | `./scripts/load.sh` |
| verify metrics | `./scripts/verify-metrics.sh` |
| down stack | `./scripts/obs-down.sh` |
| local app only | `cd service && uvicorn app.main:app --host 127.0.0.1 --port 8080` |
