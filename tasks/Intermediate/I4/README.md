# Currency Converter — Two-Component System

A small FastAPI service with a `/convert` endpoint and a Node.js CLI client that calls it. Exchange rates are hardcoded in the service.

## Layout

```
I4/
├── service/          # FastAPI app + pytest suite
└── client/           # Node.js CLI + verification script
```

Supported currencies: `USD`, `EUR`, `GBP`, `INR`.

## Prerequisites

- Python 3.9+
- Node.js 18+ (uses built-in `fetch`)

## Terminal 1 — Start the FastAPI service

```bash
cd tasks/Intermediate/I4/service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Service URLs:

- Health: `http://127.0.0.1:8000/health`
- Convert: `POST http://127.0.0.1:8000/convert`
- Supported currencies: `GET http://127.0.0.1:8000/currencies`

Example request:

```bash
curl -s -X POST http://127.0.0.1:8000/convert \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100, "from_currency": "USD", "to_currency": "EUR"}'
```

## Terminal 2 — Run the Node.js CLI client

With the service running in Terminal 1:

```bash
cd tasks/Intermediate/I4/client
node bin/convert.js 100 USD EUR
```

Optional base URL override:

```bash
CONVERTER_URL=http://127.0.0.1:8000 node bin/convert.js 50 GBP INR
```

Expected output shape:

```text
100 USD = 92 EUR (rate 0.92)
```

## Tests and verification

### Service tests (pytest)

```bash
cd tasks/Intermediate/I4/service
source .venv/bin/activate
pytest -q
```

Covers successful conversion, currency normalization, invalid amount (422), unsupported currency (400), and currency listing.

### Client verification

Validation-only checks run without the service. Live checks require the service on port 8000.

```bash
cd tasks/Intermediate/I4/client
npm run verify
```

This script validates CLI argument parsing and, when the service is up, exercises `POST /convert` and a successful CLI invocation.

## Input validation

**Service (Pydantic + app logic)**

- `amount` must be greater than zero
- `from_currency` / `to_currency` must be 3-letter codes (normalized to uppercase)
- unsupported currencies return HTTP 400 with a clear message

**Client (before calling the service)**

- requires exactly three positional args: amount, from, to
- rejects non-positive or non-numeric amounts
- rejects invalid or locally unsupported currency codes

## Hardcoded rates (USD base)

| Currency | Rate vs USD |
|----------|-------------|
| USD      | 1.00        |
| EUR      | 0.92        |
| GBP      | 0.79        |
| INR      | 83.12       |

Conversion formula: `converted = amount * (rate_to / rate_from)`, rounded to 2 decimal places.
