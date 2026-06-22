# Agent vs Manual Verification — B3 Test Discovery

Comparison of the agent's reSlim test-discovery run against manual verification on in-repo warm-up targets (B4/B5/B6).

## Primary comparison

| Source | Result |
| --- | --- |
| Agent suggestion | Newman run on reSlim (`npx newman run "resources/postman/reSlim Dev Test.postman_collection.json"`) |
| Outcome | ECONNREFUSED — all 15 Postman requests failed (`connect ECONNREFUSED 127.0.0.1:1337`); exit code 1 |
| Manual verification | `pytest -v` on B4 (`tasks/Basics/B4`) |
| Result | **5 passed** in 0.58s (exit code 0) |

**Interpretation:** The agent correctly identified reSlim's Postman/Newman harness but could not produce a green run because the PHP API was not running and the environment lacked PHP/Composer/MySQL. Manual verification on the suggested warm-up target B4 found a working pytest suite with no external server dependency.

## Agent failure evidence

Source: [`../agent-run-output-reslim-failed.md`](../agent-run-output-reslim-failed.md)

```text
Command: cd /Users/mayanksrivastava/Desktop/kyc-mini/reSlim && npx --yes newman run "resources/postman/reSlim Dev Test.postman_collection.json"
Exit code: 1
→ POST http://localhost:1337/reSlim/src/api/dev/middleware/test/param/body [errored] connect ECONNREFUSED 127.0.0.1:1337
All 15 requests failed with connect ECONNREFUSED 127.0.0.1:1337
```

## Manual green-run evidence

### B4 — pytest

Command:

```bash
cd tasks/Basics/B4 && source .venv/bin/activate && pytest -v
```

Captured in [`pytest-b4-green.txt`](pytest-b4-green.txt):

```text
============================== 5 passed in 0.58s ===============================
```

### B5 — Vitest

Command:

```bash
cd tasks/Basics/B5 && npm ci && npm test
```

Captured in [`vitest-b5-green.txt`](vitest-b5-green.txt):

```text
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### B6 — cargo test

Command:

```bash
cd tasks/Basics/B6 && cargo test
```

Captured in [`cargo-b6-green.txt`](cargo-b6-green.txt):

```text
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

## Summary

| Target | Framework | Tests passed | Exit code | Proof |
| --- | --- | ---: | ---: | --- |
| reSlim (agent) | Newman / Postman | 0 / 15 requests | 1 | [`agent-run-output-reslim-failed.md`](../agent-run-output-reslim-failed.md) |
| B4 (manual) | pytest | 5 | 0 | [`pytest-b4-green.txt`](pytest-b4-green.txt) |
| B5 (manual) | Vitest | 6 | 0 | [`vitest-b5-green.txt`](vitest-b5-green.txt) |
| B6 (manual) | cargo test | 5 | 0 | [`cargo-b6-green.txt`](cargo-b6-green.txt) |
