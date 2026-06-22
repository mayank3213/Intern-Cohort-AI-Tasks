# Agent vs Manual Verification

Compares claims in [`agent-run-output-reslim.md`](../agent-run-output-reslim.md) against proof captured under `proof/`. Required deliverable per I6 README §5 / `seeded-bug-diagnoser.md` §6.

## Summary

| Area | Agent Output | Manual Verification | Result |
| --- | --- | --- | --- |
| Bug reproduction | Failure at `store.js:36` — `<=` guard | Targeted vitest run — [`02-reproduce-failing-test.txt`](02-reproduce-failing-test.txt) | Confirmed |
| Root cause location | `fixture/sandbox/src/store.js:36` | Failing assertion `expected 400 to be 201` | Confirmed |
| Minimal fix | Change `<=` → `<` on debit guard | One-character patch — [`03-diff-applied.patch`](03-diff-applied.patch) | Confirmed |
| Full suite after fix | Predicted 6/6 pass | `npm test` — [`04-verify-all-green.txt`](04-verify-all-green.txt) | Confirmed |
| Sandbox preparation | B5 + seed patch | [`01-prepare-sandbox.txt`](01-prepare-sandbox.txt) | Confirmed |

---

## Findings

| Finding | Agent Detected | Manually Reproduced | Status |
| --- | --- | --- | --- |
| Bug reproduces with stated command | Yes | Yes — exit 1; `expected 400 to be 201` | Confirmed |
| Root cause at `store.js:36` | Yes | Yes — line 36 uses `<=` in seeded sandbox | Confirmed |
| Minimal one-character fix resolves bug | Yes | Yes — patch applied; full suite green | Confirmed |
| No adjacent behavior regression | Yes | Yes — 6/6 pass after fix | Confirmed |
| Sandbox prepared from B5 + seed | Implied | Yes — prepare script output captured | Confirmed |
| Cross-environment / CI validation | Not suggested | Not run | Unverified |

---

## Commands Used

```bash
# Step 1 — sandbox
cd tasks/Intermediate/I6 && ./scripts/prepare-sandbox.sh

# Step 2 — reproduce (before fix)
cd tasks/Intermediate/I6/fixture/sandbox
npm install
npm test -- -t "allows debit equal to full balance"

# Step 3 — fix (one character in src/store.js: <= → < at line 36)
git diff src/store.js   # captured in proof/03-diff-applied.patch

# Step 4 — verify
npm test
```

---

## Differences Between Agent and Manual Review

**Agent detected correctly**

- Seeded bug reproduces with the exact targeted test name the agent cited.
- Root cause is the debit guard using `<=` instead of `<`.
- Minimal fix restores expected 201 on full-balance debit without breaking other tests.

**Required manual confirmation**

- Sandbox bootstrap via `prepare-sandbox.sh` was executed and logged before reproduction.
- Pre-fix failure and post-fix green suite were captured as separate proof files.

**Could not reproduce / not run**

- No discrepancies observed between agent diagnosis and manual execution for in-scope steps.
- Full CI, lint, or deployment validation were not run.

**Remaining uncertainty**

- Behavior verified only in the I6 sandbox copy of B5, not in the canonical B5 tree or production-like environment.

---

## Final Confidence

**High confidence** — Agent root-cause analysis, minimal fix, and full-suite verification all match manual reproduction with captured terminal output. Only out-of-scope CI/cross-env checks remain unverified.

---

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [`01-prepare-sandbox.txt`](01-prepare-sandbox.txt) | `prepare-sandbox.sh` stdout |
| [`02-reproduce-failing-test.txt`](02-reproduce-failing-test.txt) | Failing targeted test output (pre-fix) |
| [`03-diff-applied.patch`](03-diff-applied.patch) | Git diff for `src/store.js` |
| [`04-verify-all-green.txt`](04-verify-all-green.txt) | Full `npm test` output after fix |
