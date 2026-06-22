# Test Discovery & Execution — B4 Transaction Ledger

Repository: `$REPO_ROOT/tasks/Basics/B4`

---

## Framework detection

- **Pytest detected** — `pytest==8.3.4` listed in `requirements.txt`; `tests/test_api.py` uses `def test_*` functions and FastAPI `TestClient` fixtures
- **requirements.txt detected** — `tasks/Basics/B4/requirements.txt` (FastAPI, uvicorn, pydantic, pytest, httpx)
- **tests/ directory detected** — `tasks/Basics/B4/tests/test_api.py` (5 test functions)

Detection evidence:

```bash
ls tasks/Basics/B4/requirements.txt
ls tasks/Basics/B4/tests/
rg '^def test_' tasks/Basics/B4/tests -g '*.py'
```

---

## Test command used

Run from `tasks/Basics/B4` with virtualenv active:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

---

## Green run summary

Command:

```bash
cd tasks/Basics/B4 && source .venv/bin/activate && pytest -v
```

Exit code: **0**

Key output (verbatim from [`proof/pytest-b4-green.txt`](proof/pytest-b4-green.txt)):

```text
============================= test session starts ==============================
platform darwin -- Python 3.9.6, pytest-8.3.4, pluggy-1.6.0 -- /Users/mayanksrivastava/Desktop/agent/tasks/Basics/B4/.venv/bin/python3
cachedir: .pytest_cache
rootdir: /Users/mayanksrivastava/Desktop/agent/tasks/Basics/B4
plugins: anyio-4.12.1
collecting ... collected 5 items

tests/test_api.py::test_create_credit_transaction_returns_201 PASSED     [ 20%]
tests/test_api.py::test_invalid_amount_is_rejected_with_422 PASSED       [ 40%]
tests/test_api.py::test_balance_reflects_credits_and_debits PASSED       [ 60%]
tests/test_api.py::test_debit_rejected_when_insufficient_funds_returns_400 PASSED [ 80%]
tests/test_api.py::test_list_transactions_returns_created_items PASSED   [100%]

============================== 5 passed in 0.58s ===============================
```

---

## Related green runs (manual verification)

Additional targets executed for B3 proof artifacts:

| Target | Command | Result | Proof file |
| --- | --- | --- | --- |
| B5 | `npm test` (Vitest) | 6 passed | [`proof/vitest-b5-green.txt`](proof/vitest-b5-green.txt) |
| B6 | `cargo test` | 5 passed (lib unit tests) | [`proof/cargo-b6-green.txt`](proof/cargo-b6-green.txt) |

Failed agent sample preserved at [`agent-run-output-reslim-failed.md`](agent-run-output-reslim-failed.md) (Newman on reSlim — ECONNREFUSED).
