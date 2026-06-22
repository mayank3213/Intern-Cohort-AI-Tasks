#!/usr/bin/env bash
# Regenerate proof/run-all-tests-output.txt and proof/run-integration-output.txt
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROOF="$ROOT/proof"
DATA_DIR="$ROOT/data"
API_PORT="${API_PORT:-8000}"

# Ensure cargo writes to project-local target/ (required by Python/Node integration tests)
export CARGO_TARGET_DIR="$ROOT/rust-scorer/target"

mkdir -p "$PROOF" "$DATA_DIR/pending" "$DATA_DIR/completed"

run_unit_tests() {
  {
    echo "=== A3 Polyglot Fraud Pipeline — run-all-tests ==="
    echo "Captured: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "Root: $ROOT"
    echo "CARGO_TARGET_DIR: $CARGO_TARGET_DIR"
    echo ""

    echo "================================================================================"
    echo "1. Rust — cargo test"
    echo "Command: cd rust-scorer && cargo test"
    echo "================================================================================"
    cd "$ROOT/rust-scorer"
    START=$(date +%s.%N)
    cargo test 2>&1
    RUST_EXIT=$?
    END=$(date +%s.%N)
    echo ""
    echo "Exit code: $RUST_EXIT"
    echo "Elapsed (s): $(echo "$END - $START" | bc)"
    echo ""

    echo "================================================================================"
    echo "2. Python — pytest -v"
    echo "Command: cd python-api && source .venv/bin/activate && pytest -v"
    echo "================================================================================"
    cd "$ROOT/python-api"
    # shellcheck disable=SC1091
    source .venv/bin/activate
    START=$(date +%s.%N)
    pytest -v 2>&1
    PY_EXIT=$?
    END=$(date +%s.%N)
    echo ""
    echo "Exit code: $PY_EXIT"
    echo "Elapsed (s): $(echo "$END - $START" | bc)"
    echo ""

    echo "================================================================================"
    echo "3. Node — npm test (requires Rust release binary)"
    echo "Command: cd node-worker && export FRAUD_SCORER_BIN=... && npm test"
    echo "================================================================================"
    cd "$ROOT/rust-scorer"
    cargo build --release --quiet 2>&1
    BUILD_EXIT=$?
    echo "cargo build --release exit code: $BUILD_EXIT"
    cd "$ROOT/node-worker"
    export FRAUD_SCORER_BIN="$ROOT/rust-scorer/target/release/fraud-scorer"
    START=$(date +%s.%N)
    npm test 2>&1
    NODE_EXIT=$?
    END=$(date +%s.%N)
    echo ""
    echo "Exit code: $NODE_EXIT"
    echo "Elapsed (s): $(echo "$END - $START" | bc)"
    echo ""

    echo "================================================================================"
    echo "SUMMARY"
    echo "================================================================================"
    echo "Rust exit code:   $RUST_EXIT"
    echo "Python exit code: $PY_EXIT"
    echo "Node exit code:   $NODE_EXIT"
    if [ "$RUST_EXIT" -eq 0 ] && [ "$PY_EXIT" -eq 0 ] && [ "$NODE_EXIT" -eq 0 ]; then
      echo "Overall: PASS"
    else
      echo "Overall: FAIL"
      exit 1
    fi
  } | tee "$PROOF/run-all-tests-output.txt"
}

run_integration() {
  TX_ID="tx-proof-$(date +%s)"
  UVICORN_LOG="$(mktemp)"
  WORKER_LOG="$(mktemp)"
  trap 'kill "$WORKER_PID" "$UVICORN_PID" 2>/dev/null || true' EXIT

  find "$DATA_DIR/pending" -maxdepth 1 -name '*.json' -delete 2>/dev/null || true
  find "$DATA_DIR/completed" -maxdepth 1 -name '*.json' -delete 2>/dev/null || true

  {
    echo "=== A3 Polyglot Fraud Pipeline — integration run ==="
    echo "Captured: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "Root: $ROOT"
    echo "Transaction ID: $TX_ID"
    echo ""

    echo "================================================================================"
    echo "Step 0 — Build Rust scorer"
    echo "Command: cd rust-scorer && cargo build --release"
    echo "================================================================================"
    cd "$ROOT/rust-scorer"
    cargo build --release 2>&1
    echo "Exit code: $?"
    echo ""

    echo "================================================================================"
    echo "Step 1 — Start FastAPI (background)"
    echo "Command: uvicorn app.main:app --host 127.0.0.1 --port $API_PORT"
    echo "================================================================================"
    cd "$ROOT/python-api"
    # shellcheck disable=SC1091
    source .venv/bin/activate
    export FRAUD_DATA_DIR="$DATA_DIR"
    uvicorn app.main:app --host 127.0.0.1 --port "$API_PORT" >"$UVICORN_LOG" 2>&1 &
    UVICORN_PID=$!
    echo "Uvicorn PID: $UVICORN_PID"
    sleep 2
    echo "--- uvicorn startup log ---"
    cat "$UVICORN_LOG"
    echo ""

    echo "================================================================================"
    echo "Step 2 — Start Node worker (background)"
    echo "Command: npm start"
    echo "================================================================================"
    cd "$ROOT/node-worker"
    export FRAUD_DATA_DIR="$DATA_DIR"
    export FRAUD_SCORER_BIN="$ROOT/rust-scorer/target/release/fraud-scorer"
    export WORKER_POLL_MS=300
    npm start >"$WORKER_LOG" 2>&1 &
    WORKER_PID=$!
    echo "Worker PID: $WORKER_PID"
    sleep 1
    echo "--- worker startup log ---"
    cat "$WORKER_LOG"
    echo ""

    echo "================================================================================"
    echo "Step 3 — POST /transactions (ingest)"
    echo "================================================================================"
    PAYLOAD=$(cat <<EOF
{
  "transaction_id": "$TX_ID",
  "amount": 6200,
  "currency": "USD",
  "merchant_category": "gambling",
  "country": "CA",
  "device_id": "device-proof",
  "timestamp": "2025-06-17T04:00:00Z"
}
EOF
)
    echo "Request payload:"
    echo "$PAYLOAD"
    echo ""
    echo "Command:"
    echo "curl -s -w '\nHTTP_STATUS: %{http_code}\n' -X POST http://127.0.0.1:$API_PORT/transactions ..."
    INGEST=$(curl -s -w "\nHTTP_STATUS: %{http_code}\n" -X POST "http://127.0.0.1:$API_PORT/transactions" \
      -H 'Content-Type: application/json' \
      -d "$PAYLOAD")
    echo "Response:"
    echo "$INGEST"
    echo ""

    echo "================================================================================"
    echo "Step 4 — Poll GET /transactions/{id} until scored"
    echo "================================================================================"
    for i in $(seq 1 10); do
      echo "--- poll attempt $i ---"
      POLL=$(curl -s -w "\nHTTP_STATUS: %{http_code}\n" "http://127.0.0.1:$API_PORT/transactions/$TX_ID")
      echo "$POLL"
      if echo "$POLL" | grep -q '"status":"scored"'; then
        echo "Scored result received on attempt $i"
        break
      fi
      sleep 1
    done
    echo ""

    echo "================================================================================"
    echo "Step 5 — Queue filesystem state"
    echo "================================================================================"
    echo "pending/:"
    ls -la "$DATA_DIR/pending/" 2>&1 || true
    echo "completed/:"
    ls -la "$DATA_DIR/completed/" 2>&1 || true
    if [ -f "$DATA_DIR/completed/$TX_ID.json" ]; then
      echo "--- completed/$TX_ID.json ---"
      cat "$DATA_DIR/completed/$TX_ID.json"
    fi
    echo ""

    echo "================================================================================"
    echo "Step 6 — Worker log (tail)"
    echo "================================================================================"
    cat "$WORKER_LOG"
    echo ""

    echo "================================================================================"
    echo "Cleanup — stopping background processes"
    echo "================================================================================"
    kill "$WORKER_PID" 2>/dev/null && echo "Worker stopped (exit $?)" || echo "Worker already stopped"
    kill "$UVICORN_PID" 2>/dev/null && echo "Uvicorn stopped (exit $?)" || echo "Uvicorn already stopped"
    wait "$WORKER_PID" 2>/dev/null || true
    wait "$UVICORN_PID" 2>/dev/null || true
    echo "Integration run complete."
  } | tee "$PROOF/run-integration-output.txt"

  rm -f "$UVICORN_LOG" "$WORKER_LOG"
  trap - EXIT
}

echo "==> unit/component tests"
run_unit_tests

echo ""
echo "==> end-to-end integration"
run_integration

echo ""
echo "Proof artifacts written to:"
echo "  $PROOF/run-all-tests-output.txt"
echo "  $PROOF/run-integration-output.txt"
