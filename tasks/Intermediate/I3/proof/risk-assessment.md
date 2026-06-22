# Risk Assessment — I3 B4 Insufficient-Funds Patch

Patch target: `tasks/Basics/B4` — richer debit rejection detail + one API regression test.

## Production files touched

| # | File | Change | Why |
| --- | --- | --- | --- |
| 1 | `app/store.py` | Modified (+3 −1) | Only production guard for overdraw debits (`TransactionStore.add`). `source: app/store.py:12-16` |

**Production file count: 1** (budget ≤ 2)

## Test files touched

| File | Change | Why |
| --- | --- | --- |
| `tests/test_api.py` | Modified (+18 −0) | Locks HTTP 400 contract and error detail for overdraw. `source: tests/test_api.py:64-79` |

## Risk matrix

| area | level | note |
| --- | --- | --- |
| regression | **low** | Guard condition unchanged (`balance < amount`); only error message text differs. |
| api_contract | **low–medium** | HTTP status stays 400; `detail` body changes from fixed string to formatted amounts. Clients parsing exact text may need coordination. |
| data_migration | **none** | In-memory store; no schema or persistence changes. |
| performance | **none** | Reject path still calls `balance()` twice (pre-existing). |

**Overall risk: low** — behavior was already enforced; change adds test coverage and clearer operator-facing detail.

## Rollback steps

1. From repository root, revert the patch (either apply inverse diff or restore files):

   ```bash
   cd /Users/mayanksrivastava/Desktop/agent
   git checkout HEAD -- tasks/Basics/B4/app/store.py tasks/Basics/B4/tests/test_api.py
   ```

   If working from the saved patch instead of git:

   ```bash
   patch -R -p1 < tasks/Intermediate/I3/proof/diff-applied.patch
   ```

2. Confirm production guard restored to the original message:

   ```bash
   rg 'Insufficient funds for debit transaction' tasks/Basics/B4/app/store.py
   ```

3. Re-run the module test suite — expect **4 passed** (new overdraw test removed):

   ```bash
   cd tasks/Basics/B4 && .venv/bin/pytest tests/test_api.py -v
   ```

4. Optional smoke check: POST a debit larger than balance via curl or TestClient should still return HTTP 400 with the legacy detail string.

## Blast-radius budget

| metric | budget | actual |
| --- | --- | --- |
| production files | ≤ 2 | 1 |
| test files | ≤ 1 | 1 |
| lines changed (approx) | ≤ 40 | ~22 |
| new dependencies | 0 | 0 |

**Verdict:** within budget.
