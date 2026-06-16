# Surgical Patch Report — B4 Transaction Ledger

```yaml
agent: surgical-patcher
version: 1.0
repo_root: /Users/mayanksrivastava/Desktop/agent/tasks/Basics/B4
change_category: guard
change_intent: "Reject debit when balance is insufficient; return HTTP 400 with actionable detail; add API test"
anchor: POST /transactions → app/store.py::TransactionStore.add
branch: patch_not_applied  # workspace is not a git repo
diff_stats: "2 files, +21 −1"
test_command: ".venv/bin/pytest tests/test_api.py -q"
test_result: pass
```

## Executive summary

The B4 ledger API already blocked overdraw debits in `TransactionStore.add`, but the behavior was **untested** and the error message was generic. This patch improves the `ValueError` detail to include current balance and requested debit amounts, and adds one integration test asserting HTTP 400 and message contents. All five API tests pass in 0.60s.

---

## Diff or branch

No git branch (repo not initialized). Unified diff:

```diff
--- a/app/store.py
+++ b/app/store.py
@@ -10,7 +10,10 @@
 
     def add(self, payload: TransactionCreate) -> TransactionResponse:
         if payload.type is TransactionType.DEBIT and self.balance() < payload.amount:
-            raise ValueError("Insufficient funds for debit transaction")
+            raise ValueError(
+                f"Insufficient funds: balance {self.balance():.2f}, "
+                f"requested debit {payload.amount:.2f}"
+            )
 
         transaction = TransactionResponse(
```

```diff
--- a/tests/test_api.py
+++ b/tests/test_api.py
@@ -61,6 +61,24 @@
     assert response.json()["balance"] == "150.00"
 
 
+def test_debit_rejected_when_insufficient_funds_returns_400() -> None:
+    client.post(
+        "/transactions",
+        json={"amount": "50", "type": "credit", "description": "Seed balance"},
+    )
+
+    response = client.post(
+        "/transactions",
+        json={"amount": "100", "type": "debit", "description": "Overdraw attempt"},
+    )
+
+    assert response.status_code == 400
+    detail = response.json()["detail"]
+    assert "Insufficient funds" in detail
+    assert "50.00" in detail
+    assert "100.00" in detail
+
+
 def test_list_transactions_returns_created_items() -> None:
```

---

## Files changed

| file | action | lines ± | why this file |
|---|---|---|---|
| `app/store.py` | modified | +3 −1 | **Production guard** — `TransactionStore.add` is the only place that enforces the insufficient-funds rule before persisting a debit. Richer error detail belongs here where balance and amount are in scope. `source: app/store.py:12-16` |
| `tests/test_api.py` | modified | +18 −0 | **Regression test** — existing suite uses FastAPI `TestClient` against `/transactions`; one new test mirrors `test_invalid_amount_is_rejected_with_422` style and locks the 400 contract for overdraw. `source: tests/test_api.py:64-81` |

---

## Files considered but not changed

| file | reason left untouched |
|---|---|
| `app/main.py` | Already maps `ValueError` → HTTP 400 via `HTTPException`; no handler change needed. `source: app/main.py:20-26` |
| `app/schemas.py` | Amount validation (`gt=0`) and type enum are unrelated to balance checks. |
| `requirements.txt` | No new dependencies. |

---

## Test command and result

**Targeted (new test only):**

```bash
cd tasks/Basics/B4 && .venv/bin/pytest tests/test_api.py::test_debit_rejected_when_insufficient_funds_returns_400 -q
```

```
.                                                                        [100%]
1 passed in 0.55s
```

**Module suite:**

```bash
cd tasks/Basics/B4 && .venv/bin/pytest tests/test_api.py -q
```

```
.....                                                                    [100%]
5 passed in 0.60s
```

---

## Risk assessment

| area | level | note |
|---|---|---|
| regression | **low** | Guard condition unchanged (`balance < amount`); only message string differs. |
| api_contract | **low–medium** | Error `detail` body changes from fixed string to formatted string with amounts. Clients parsing exact text could break; status code (400) unchanged. |
| data_migration | **none** | In-memory store only; no DB. |
| performance | **none** | `balance()` called twice on reject path (pre-existing pattern for the guard). |

**Overall risk: low** — behavior was already enforced; change adds test coverage and clearer operator-facing detail.

---

## Agent suggested vs manually verified

| claim | suggested by agent | manually verified |
|---|---|---|
| New test fails before patch (missing coverage) | yes — agent inferred untested path | **not run** — baseline not captured in this session |
| All module tests pass after patch | yes | **yes** — 5/5 passed |
| HTTP 400 returned on overdraw | yes | **yes** — asserted in new test |
| Error detail includes balance and debit amounts | yes | **yes** — asserted `"50.00"` and `"100.00"` in detail |
| `main.py` exception mapping still correct | yes — read-only review | **yes** — `ValueError` → 400 unchanged |
| Edge: debit exactly equal to balance allowed | yes — inferred from `<` not `<=` | **not run** — no dedicated test added |
| Edge: zero-balance debit without prior credit | yes — should 400 | **not run** |
| Full CI / lint / type-check | not suggested | **not run** |
| Manual curl against running uvicorn | not suggested | **not run** |

---

## Follow-up

- Add test for **exact-balance debit** (debit == balance → 201) to document `<=` vs `<` intent.
- Add test for **zero-balance first debit** (no seed credit).
- If any client parses `detail` verbatim, coordinate as a **low-severity breaking** API change or keep old prefix string for compatibility.

---

## Blast-radius budget (Phase 3)

| metric | budget | actual |
|---|---|---|
| production files | ≤ 2 | 1 |
| test files | ≤ 1 | 1 |
| lines changed (approx) | ≤ 40 | ~22 |
| new dependencies | 0 | 0 |

**Verdict:** within budget — no scope overflow.
