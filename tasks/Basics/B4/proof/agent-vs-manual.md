# Agent vs Manual Verification — B4 Transaction Ledger

Comparison of agent-generated FastAPI scaffold against manual execution and verification from `tasks/Basics/B4`.

## Verification summary

| Source | Result |
| --- | --- |
| Agent contribution | Generated FastAPI scaffold |
| Manual verification | `pytest -v` — 5 passed ([pytest-output.txt](pytest-output.txt)) |
| Smoke test | POST /transactions — HTTP 201 ([uvicorn-smoke.txt](uvicorn-smoke.txt)) |
| Smoke test | GET /transactions — HTTP 200 ([uvicorn-smoke.txt](uvicorn-smoke.txt)) |
| Smoke test | GET /balance — HTTP 200 ([uvicorn-smoke.txt](uvicorn-smoke.txt)) |
| Validation test | Invalid request rejected — HTTP 422 ([validation-rejected.txt](validation-rejected.txt)) |
| Outcome | Application verified |

## Commands used

```bash
cd tasks/Basics/B4
source .venv/bin/activate
pytest -v
uvicorn app.main:app --host 127.0.0.1 --port 9877
curl -X POST http://127.0.0.1:9877/transactions -H "Content-Type: application/json" \
  -d '{"amount": "100.00", "type": "credit", "description": "Opening deposit"}'
curl http://127.0.0.1:9877/transactions
curl http://127.0.0.1:9877/balance
curl -X POST http://127.0.0.1:9877/transactions -H "Content-Type: application/json" \
  -d '{"amount": -10, "type": "credit", "description": "Invalid amount"}'
```

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [pytest-output.txt](pytest-output.txt) | Full `pytest -v` terminal output (exit 0) |
| [uvicorn-smoke.txt](uvicorn-smoke.txt) | curl smoke tests for POST/GET endpoints |
| [validation-rejected.txt](validation-rejected.txt) | Invalid POST rejected with HTTP 422 |
| [pytest-all-tests-passed.png](pytest-all-tests-passed.png) | Screenshot (retained) |
| [uvicorn-swagger-docs.png](uvicorn-swagger-docs.png) | Screenshot (retained) |
