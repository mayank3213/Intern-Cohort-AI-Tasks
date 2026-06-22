# Agent vs Manual Verification — A3 Polyglot Fraud Pipeline

Comparison of the existing three-component pipeline (Python API → Node worker → Rust scorer) against manual shell verification run on 2026-06-22.

## Stage summary

| Stage | Agent Contribution | Manual Verification |
| --- | --- | --- |
| API scaffold | Generated (FastAPI ingest + status routes) | Tested via `pytest -v` (6 API unit tests) |
| Worker integration | Suggested (Node polls `data/pending/`, invokes scorer) | Verified via `npm test` (3 tests) + live worker log |
| Rust scoring | Generated (library + CLI + rule engine) | `cargo test` executed (7 tests total) |
| End-to-end flow | Proposed (file-queue handoff per `data-contract.json`) | Confirmed via live integration run + curl |
| Final result | Expected: pending → scored HIGH for high-risk payload | Actual output recorded in proof artifacts |

## Test counts (manual run)

Commands:

```bash
cd tasks/Advanced/A3/rust-scorer && cargo test
cd tasks/Advanced/A3/python-api && source .venv/bin/activate && pytest -v
cd tasks/Advanced/A3/node-worker && export FRAUD_SCORER_BIN=../rust-scorer/target/release/fraud-scorer && npm test
```

| Component | Tests run | Result | Source |
| --- | ---: | --- | --- |
| Rust (`cargo test`) | 7 | PASS | [`run-all-tests-output.txt`](run-all-tests-output.txt) |
| Python (`pytest -v`) | 7 | PASS | [`run-all-tests-output.txt`](run-all-tests-output.txt) |
| Node (`npm test`) | 3 | PASS | [`run-all-tests-output.txt`](run-all-tests-output.txt) |

## End-to-end and curl evidence

| Check | Agent expectation | Manual observation | Match |
| --- | --- | --- | --- |
| POST `/transactions` returns 202 + `pending` | Yes | `HTTP_STATUS: 202` | Yes |
| Worker scores queued file | Yes | `scored tx-proof-… -> HIGH (90)` in worker log | Yes |
| GET `/transactions/{id}` returns `scored` | Yes | Scored on poll attempt 2 | Yes |
| `risk_level` for demo payload | HIGH | HIGH | Yes |
| `risk_score` for demo payload | README cites rules summing to HIGH band; screenshot shows 75 for fixture CLI | Live run: **90** (rules: tier2 + foreign + gambling + night) | Partial — score differs from PNG fixture example but level is consistent |

## Discrepancies and uncertainty

1. **Risk score number vs screenshot:** The PNG [`rust-scorer-cli-output.png`](rust-scorer-cli-output.png) shows `risk_score: 75` for the static fixture CLI check. The live integration and curl runs with the README demo payload (`amount: 6200`, `CA`, `gambling`, night timestamp) produced **`risk_score: 90`**. Both are `HIGH`; the difference likely reflects fixture vs demo payload or rule stacking — not re-verified against the PNG fixture in this session.
2. **`CARGO_TARGET_DIR` in Cursor:** An initial test run failed because the sandbox redirected Rust builds away from `rust-scorer/target/release/`. Setting `CARGO_TARGET_DIR` to the project path (as in [`../scripts/run-all-tests.sh`](../scripts/run-all-tests.sh)) was required for Python integration and Node tests to find `fraud-scorer`.
3. **No separate agent-run ledger:** Unlike some Basics tasks, A3 has no `agent-run-output-*.md`; this table compares README/architecture claims to manual execution only.

## Scan evidence

| Artifact | Description |
| --- | --- |
| [`run-all-tests-output.txt`](run-all-tests-output.txt) | Rust, Python, Node test output with exit codes and timing |
| [`run-integration-output.txt`](run-integration-output.txt) | Live FastAPI + worker startup, POST, poll, filesystem state |
| [`curl-ingest-and-poll.txt`](curl-ingest-and-poll.txt) | curl ingest (202) and poll (200, scored JSON) |
| [`../scripts/run-all-tests.sh`](../scripts/run-all-tests.sh) | Regenerates test + integration proof files |

Existing PNG screenshots under `proof/` were retained unchanged.
