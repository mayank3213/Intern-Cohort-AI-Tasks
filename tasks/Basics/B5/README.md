# Transaction Ledger API

A small **FastAPI** service with in-memory storage for deposits, withdrawals, balance, and transaction history.

> **Note:** FastAPI is a Python framework. This service uses Python 3.10+.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/transactions` | Create a deposit or withdrawal |
| `GET` | `/transactions` | List all transactions |
| `GET` | `/balance` | Get current balance |

### POST /transactions body

```json
{
  "type": "deposit",
  "amount": 100.0,
  "description": "Paycheck"
}
```

- `type`: `"deposit"` or `"withdrawal"`
- `amount`: must be **> 0**
- `description`: 1–200 characters

Withdrawals return `400` when balance is insufficient. Invalid input returns `422`.

## Install

From this directory (`tasks/Basics/B5`):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/docs for interactive Swagger UI.

### Example requests

```bash
curl -X POST http://127.0.0.1:8000/transactions \
  -H "Content-Type: application/json" \
  -d '{"type":"deposit","amount":100,"description":"Paycheck"}'

curl http://127.0.0.1:8000/balance

curl http://127.0.0.1:8000/transactions
```

## Test

```bash
pytest -v
```

## Project layout

```
B5/
├── app/
│   ├── main.py      # FastAPI app and routes
│   ├── schemas.py   # Pydantic models + validation
│   └── store.py     # In-memory transaction store
├── tests/
│   └── test_api.py  # API tests
├── requirements.txt
└── README.md
```
