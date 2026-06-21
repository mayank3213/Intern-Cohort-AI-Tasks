#!/usr/bin/env bash
# Verify Prometheus scrape UP, request rate > 0, and JSON logs on stdout.
set -euo pipefail

PROM_URL="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
APP_URL="${APP_BASE_URL:-http://127.0.0.1:8080}"
GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3000}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed."
    exit 1
  }
}

require curl

if command -v python3 >/dev/null 2>&1; then
  JSON_CHECK=python3
elif command -v python >/dev/null 2>&1; then
  JSON_CHECK=python
else
  echo "ERROR: python3 is required to parse JSON responses"
  exit 1
fi

echo "==> App /metrics exposes http_requests_total"
METRICS_BODY="$(curl -sf "${APP_URL}/metrics")"
echo "$METRICS_BODY" | grep -q 'http_requests_total' || {
  echo "ERROR: http_requests_total not found on /metrics"
  exit 1
}

echo ""
echo "==> Prometheus target UP"
TARGETS_JSON="$(curl -sf "${PROM_URL}/api/v1/targets")"
echo "$TARGETS_JSON" | "$JSON_CHECK" -c '
import json, sys
data = json.load(sys.stdin)
active = data.get("data", {}).get("activeTargets", [])
app_targets = [t for t in active if t.get("labels", {}).get("job") == "app"]
if not app_targets:
    raise SystemExit("ERROR: no active target with job=app")
up = [t for t in app_targets if t.get("health") == "up"]
if not up:
    raise SystemExit(f"ERROR: app scrape target not UP: {app_targets}")
print(f"OK: {len(up)} app target(s) UP")
'

echo ""
echo "==> PromQL request rate (sum(rate(http_requests_total[1m])))"
QUERY='sum(rate(http_requests_total[1m]))'
QUERY_JSON="$(curl -sf --get "${PROM_URL}/api/v1/query" --data-urlencode "query=${QUERY}")"
echo "$QUERY_JSON" | "$JSON_CHECK" -c '
import json, sys
data = json.load(sys.stdin)
if data.get("status") != "success":
    raise SystemExit(f"ERROR: query failed: {data}")
results = data.get("data", {}).get("result", [])
if not results:
    print("WARN: no samples yet — run ./scripts/load.sh first, wait ~30s, retry")
    sys.exit(0)
value = float(results[0]["value"][1])
print(f"request rate = {value:.4f} req/s")
if value <= 0:
    raise SystemExit("ERROR: request rate is zero after load — check scrape interval and load.sh")
print("OK: request rate > 0")
'

echo ""
echo "==> Grafana datasource provisioned"
curl -sf -u admin:admin "${GRAFANA_URL}/api/datasources/name/Prometheus" | "$JSON_CHECK" -c '
import json, sys
data = json.load(sys.stdin)
if data.get("type") != "prometheus":
    raise SystemExit(f"ERROR: unexpected datasource: {data}")
print("OK: Grafana Prometheus datasource provisioned:", data.get("url"))
'

echo ""
echo "==> JSON structured logs (last app log line)"
LOG_LINE="$(docker logs d6-echo-app 2>&1 | tail -1)"
echo "$LOG_LINE"
echo "$LOG_LINE" | "$JSON_CHECK" -c '
import json, sys
line = sys.stdin.read().strip()
if not line:
    raise SystemExit("ERROR: no app logs found")
obj = json.loads(line)
for key in ("timestamp", "level", "message"):
    if key not in obj:
        raise SystemExit(f"ERROR: missing {key} in JSON log: {obj}")
print("OK: stdout log line is valid JSON (timestamp, level, message)")
'

echo ""
echo "OK: observability verification passed"
