# I4 Demo Report — Polyglot FastAPI + Node Client

Generated 2026-06-22T18:33:00Z from actual execution. Proof artifacts live under `tasks/Intermediate/I4/proof/`.

## Architecture

```
FastAPI service (tasks/Intermediate/I4/service)
        ↓
HTTP API — GET /health, POST /convert, GET /currencies
        ↓
Node client (tasks/Intermediate/I4/client)
        ↓
Verification — scripts/verify.mjs + bin/convert.js CLI
```

- **Service**: FastAPI app in `service/app/main.py` with hardcoded USD-base rates in `service/app/rates.py`.
- **Client**: Node.js ESM CLI in `client/bin/convert.js`; HTTP calls via `client/src/client.js`; local validation in `client/src/validate.js`.
- **Contract**: `POST /convert` accepts `{ amount, from_currency, to_currency }` and returns converted amount plus effective rate.

## Commands executed

| Step | Command | Exit |
| --- | --- | ---: |
| Service tests | `cd tasks/Intermediate/I4/service && source .venv/bin/activate && pytest -v` | 0 |
| Start service | `cd tasks/Intermediate/I4/service && source .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8000` | running |
| Client verify | `cd tasks/Intermediate/I4/client && node scripts/verify.mjs` | 0 |
| CLI convert | `cd tasks/Intermediate/I4/client && node bin/convert.js 100 USD EUR` | 0 |
| Valid curl | `curl -X POST http://127.0.0.1:8000/convert -H 'Content-Type: application/json' -d '{"amount":100,"from_currency":"USD","to_currency":"EUR"}'` | HTTP 200 |
| Invalid amount curl | same endpoint, `amount: -5` | HTTP 422 |
| Unsupported currency curl | same endpoint, `to_currency: JPY` | HTTP 400 |

## Results

### Service tests (`proof/pytest-service-output.txt`)

- **6 passed** in 0.03s
- Covers USD→EUR conversion, case normalization, amount validation (422), invalid code length (422), unsupported currency (400), and currency listing

### Client verification (`proof/client-verify-output.txt`)

- Local validation checks passed (amount, code length, unsupported local codes)
- Live checks passed against running service: health 200, API convert 100 USD→92 EUR, CLI 25 GBP→USD, CLI rejects negative amount

### Two-terminal workflow (`proof/two-terminal-run.md`)

- Terminal 1: uvicorn on `http://127.0.0.1:8000`
- Terminal 2: `node scripts/verify.mjs` and `node bin/convert.js 100 USD EUR` both succeed

### API smoke tests (`proof/curl-convert.txt`)

| Case | Status | Notes |
| --- | ---: | --- |
| 100 USD → EUR | 200 | `converted_amount: 92.0`, `rate: 0.92` |
| amount -5 | 422 | Pydantic `greater_than` validation |
| USD → JPY | 400 | Unsupported currency message |

## Proof artifact index

| File | Purpose |
| --- | --- |
| `proof/pytest-service-output.txt` | Full pytest -v stdout |
| `proof/client-verify-output.txt` | Client verification command and assertions |
| `proof/two-terminal-run.md` | Terminal 1 + Terminal 2 workflow with logs |
| `proof/curl-convert.txt` | Valid and invalid POST /convert curl captures |

All outputs were captured from real commands; no service or client code was modified.
