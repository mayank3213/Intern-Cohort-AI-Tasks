# Mini Fraud Score System (A3)

A three-component fraud scoring pipeline:

1. **Python FastAPI** ingests transactions and writes them to a shared file queue.
2. **Node.js worker** polls the queue, invokes the Rust scorer, and writes completed scores.
3. **Rust CLI/library** computes deterministic risk scores from the shared transaction contract.

All components exchange JSON defined in [`docs/data-contract.json`](docs/data-contract.json).

## Layout

```
A3/
├── docs/data-contract.json   # Shared TransactionInput + RiskScoreResult schema
├── data/
│   ├── pending/              # FastAPI writes tx-{id}.json here
│   └── completed/            # Worker writes scored tx-{id}.json here
├── python-api/               # FastAPI ingestion service
├── node-worker/              # Background scoring worker
├── rust-scorer/              # Scoring library + fraud-scorer CLI
└── tests/fixtures/           # Shared JSON fixtures
```

## Data contract

### TransactionInput (ingestion → worker → scorer)

| field | type | notes |
|---|---|---|
| `transaction_id` | string | unique id |
| `amount` | number | must be > 0 |
| `currency` | string | 3-letter ISO code |
| `merchant_category` | string | e.g. `retail`, `gambling`, `crypto` |
| `country` | string | 2-letter ISO code |
| `device_id` | string | client device id |
| `timestamp` | string | ISO-8601 UTC |

### RiskScoreResult (scorer → worker → API read)

| field | type | notes |
|---|---|---|
| `transaction_id` | string | matches input |
| `risk_score` | integer | 0–100 |
| `risk_level` | string | `LOW`, `MEDIUM`, or `HIGH` |
| `reasons` | string[] | rule hits, e.g. `foreign_country` |
| `computed_at` | string | ISO-8601 UTC |

### Scoring rules (Rust)

| signal | points |
|---|---|
| amount ≥ 5000 | +35 (`high_amount_tier2`) |
| amount ≥ 1000 | +20 (`high_amount_tier1`) |
| country ≠ US | +15 (`foreign_country`) |
| category ∈ gambling, crypto, wire_transfer | +30 (`risky_merchant_category`) |
| hour 00:00–05:59 UTC | +10 (`night_transaction`) |

Levels: `LOW` 0–29, `MEDIUM` 30–59, `HIGH` 60–100 (score capped at 100).

## Prerequisites

- Python 3.10+
- Node.js 18+
- Rust toolchain (`cargo`)

## Run order

Use three terminals from `tasks/Advanced/A3`.

### Terminal 1 — Build the Rust scorer

```bash
cd tasks/Advanced/A3/rust-scorer
cargo build --release
```

Optional direct CLI check:

```bash
./target/release/fraud-scorer score --file ../tests/fixtures/high_risk.json
```

### Terminal 2 — Start FastAPI ingestion

```bash
cd tasks/Advanced/A3/python-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export FRAUD_DATA_DIR="$(cd .. && pwd)/data"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Endpoints:

| method | path | description |
|---|---|---|
| `GET` | `/health` | service health |
| `POST` | `/transactions` | enqueue transaction (202) |
| `GET` | `/transactions/{id}` | pending or scored status |

Example ingest:

```bash
curl -s -X POST http://127.0.0.1:8000/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_id": "tx-demo-001",
    "amount": 6200,
    "currency": "USD",
    "merchant_category": "gambling",
    "country": "CA",
    "device_id": "device-demo",
    "timestamp": "2025-06-17T04:00:00Z"
  }'
```

Poll result:

```bash
curl -s http://127.0.0.1:8000/transactions/tx-demo-001
```

### Terminal 3 — Start the Node.js worker

With FastAPI running in Terminal 2 and the Rust binary built in Terminal 1:

```bash
cd tasks/Advanced/A3/node-worker
export FRAUD_DATA_DIR="$(cd .. && pwd)/data"
export FRAUD_SCORER_BIN="$(cd ../rust-scorer && pwd)/target/release/fraud-scorer"
npm start
```

The worker polls `data/pending/`, calls `fraud-scorer score --file …`, writes to `data/completed/`, and removes the pending file.

## Environment variables

| variable | component | default |
|---|---|---|
| `FRAUD_DATA_DIR` | API + worker | `tasks/Advanced/A3/data` |
| `FRAUD_SCORER_BIN` | worker | `rust-scorer/target/release/fraud-scorer` |
| `WORKER_POLL_MS` | worker | `500` |

## Tests

### Rust — core scoring + CLI integration

```bash
cd tasks/Advanced/A3/rust-scorer
cargo test
```

### Python — API unit tests + end-to-end pipeline

```bash
cd tasks/Advanced/A3/python-api
source .venv/bin/activate   # after setup above
pytest -q
```

Covers ingestion validation, queue persistence, status reads, and an integration path that builds Rust, ingests via FastAPI, runs the Node worker once, and verifies a scored result.

### Node.js — worker unit/integration

Build Rust first (`cargo build --release`), then:

```bash
cd tasks/Advanced/A3/node-worker
export FRAUD_SCORER_BIN="$(cd ../rust-scorer && pwd)/target/release/fraud-scorer"
npm test
```

## Quick verification flow

1. Build Rust scorer.
2. Start FastAPI with shared `FRAUD_DATA_DIR`.
3. Start Node worker pointing at the same data dir and scorer binary.
4. `POST /transactions` with a high-risk payload.
5. `GET /transactions/{id}` until `status` is `scored` and `risk_level` is `HIGH`.
