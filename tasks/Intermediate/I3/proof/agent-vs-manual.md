# Agent vs Manual Verification

Compares claims in [`agent-run-output-b4-ledger.md`](../agent-run-output-b4-ledger.md) against proof captured under `proof/`. Required deliverable per I3 README §5 / `surgical-patcher.md` §8.

## Summary

| Area | Agent Output | Manual Verification | Result |
| --- | --- | --- | --- |
| Patch scope (≤2 prod files) | 1 prod + 1 test file | Counted prod files in [`risk-assessment.md`](risk-assessment.md) | Confirmed |
| Unified diff | Inline in agent report | Reconstructed in [`diff-applied.patch`](diff-applied.patch) | Confirmed |
| Tests after patch | 5/5 pass | Re-ran `pytest -v` — [`pytest-after-patch.txt`](pytest-after-patch.txt) | Confirmed |
| HTTP 400 on overdraw | New test asserts 400 | Suite green; test present in patch | Confirmed |
| Error detail with amounts | Detail includes balance/debit | Test asserts `"50.00"` and `"100.00"` | Confirmed |
| Baseline pytest before patch | Inferred untested path | Not captured in this session | Unverified |
| Edge cases (exact balance, zero balance) | Inferred from `<` guard | No dedicated tests run | Unverified |
| Full CI / lint / curl smoke | Not suggested | Not run | Unverified |

---

## Findings

| Finding | Agent Detected | Manually Reproduced | Status |
| --- | --- | --- | --- |
| Patch touches ≤2 production files | Yes | Yes — 1 prod file (`app/store.py`) | Confirmed |
| Unified diff available | Yes | Yes — [`diff-applied.patch`](diff-applied.patch) | Confirmed |
| New test fails before patch | Yes | No — baseline pytest not captured | Not reproduced |
| All module tests pass after patch | Yes | Yes — 5 passed, exit 0 | Confirmed |
| HTTP 400 returned on overdraw | Yes | Yes — asserted in new test | Confirmed |
| Error detail includes balance and debit amounts | Yes | Yes — test asserts formatted amounts | Confirmed |
| `main.py` exception mapping unchanged | Yes | Yes — read-only review; no prod edit | Confirmed |
| Edge: debit equal to balance allowed | Yes | No | Unverified |
| Edge: zero-balance debit without prior credit | Yes | No | Unverified |
| Manual curl against running uvicorn | No | No | Unverified |

---

## Commands Used

```bash
# Tests after patch (working tree already contains fix)
cd tasks/Basics/B4 && .venv/bin/pytest tests/test_api.py -v

# Production file count for patch scope
# See tasks/Intermediate/I3/proof/risk-assessment.md — 1 prod file (app/store.py)
```

---

## Differences Between Agent and Manual Review

**Agent detected correctly**

- Single production-file change in `app/store.py` with matching test in `tests/test_api.py`.
- Post-patch pytest suite passes with the new insufficient-funds test.
- HTTP status and error-detail contract match agent description.

**Required manual confirmation**

- Unified diff captured separately because the tree already contained the patch when proof was recorded.
- Risk assessment and prod-file count verified independently in [`risk-assessment.md`](risk-assessment.md).

**Could not reproduce / not run**

- Pre-patch failing test run was not captured; agent inference about missing coverage is plausible but unverified here.
- Edge-case debits (exact balance, zero balance) have no dedicated manual runs.
- No lint, type-check, or live HTTP curl against uvicorn.

**Remaining uncertainty**

- API clients parsing exact error string text before the patch may behave differently; only status code and new detail format are tested.

---

## Final Confidence

**Medium confidence** — Core patch behavior and full post-patch test suite are manually confirmed. Pre-patch baseline and edge-case paths were not re-run, so coverage gaps and client-compat risks remain explicitly unverified.

---

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [`diff-applied.patch`](diff-applied.patch) | Unified diff for `app/store.py` and `tests/test_api.py` |
| [`pytest-after-patch.txt`](pytest-after-patch.txt) | Full `pytest -v` terminal output (exit 0) |
| [`risk-assessment.md`](risk-assessment.md) | Risk matrix, prod-file count, rollback steps |
| [`../agent-run-output-b4-ledger.md`](../agent-run-output-b4-ledger.md) | Agent surgical-patch report |
