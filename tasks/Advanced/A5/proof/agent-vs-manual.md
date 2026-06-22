# Agent vs Manual Verification

Compares claims in [`agent-run-output-feature-agent-modernize-search.md`](../agent-run-output-feature-agent-modernize-search.md) against proof captured under `proof/` from manual re-execution on 2026-06-23. Targets the **fixture PR** (`feature/agent-modernize-search`); reSlim review in [`agent-run-output-reslim.md`](../agent-run-output-reslim.md) is unchanged.

## Summary

| Area | Agent Output | Manual Verification | Result |
| --- | --- | --- | --- |
| Verdict | REQUEST_CHANGES (6 blocking) | Manual re-review — [`review-verdict-summary.md`](review-verdict-summary.md) | Confirmed |
| PRR-001 SQL injection | Critical blocking | [`repro-sql-injection.php`](repro-sql-injection.php) + HTTP curl — [`repro-blocking-issue-1.txt`](repro-blocking-issue-1.txt) | Confirmed |
| PRR-002 Hardcoded secret | Critical blocking | `grep api_secret` on fixture config | Confirmed |
| PRR-003 POST returns 200 not 201 | Major blocking | curl → `HTTP/1.1 200 OK` | Confirmed |
| PRR-004 Validation returns 400 not 422 | Major blocking | curl `{}` → `HTTP/1.1 400 Bad Request` | Confirmed |
| PRR-005 No automated tests | Major blocking | No `tests/` dir; 0 `*Test.php` files | Confirmed |
| PRR-006 CI lints missing `lib/` | Major blocking | `find lib` vs 5 files under `src public` | Confirmed |
| PRR-007 PII in logs | Non-blocking | Log file not inspected | Unverified |
| PRR-008 `.env` missing from `.gitignore` | Non-blocking | Static read only | Partial |
| PRR-009 No email validation | Non-blocking | Invalid email POST not run | Unverified |
| PRR-010 README PHP drift | Minor | README 5.6+ vs Composer ^8.1 | Confirmed |

---

## Findings

| Finding | Agent Detected | Manually Reproduced | Status |
| --- | --- | --- | --- |
| SQL injection in `search()` (PRR-001) | Yes | Yes — injection returns all rows; exit 1 | Confirmed |
| Hardcoded `api_secret` (PRR-002) | Yes | Yes — literal key in `config/app.php` | Confirmed |
| POST success returns 200 (PRR-003) | Yes | Yes — curl shows 200 | Confirmed |
| Validation failure returns 400 (PRR-004) | Yes | Yes — curl shows 400 | Confirmed |
| No test coverage for new code (PRR-005) | Yes | Yes — no test files | Confirmed |
| CI lints wrong directory (PRR-006) | Yes | Yes — 0 files under `lib/`; 5 under `src public` | Confirmed |
| PII logged at INFO (PRR-007) | Yes | No | Unverified |
| `.gitignore` omits `.env` (PRR-008) | Yes | Partial — file read only | Partial |
| No email format validation (PRR-009) | Yes | No | Unverified |
| README vs Composer PHP mismatch (PRR-010) | Yes | Yes — static grep/read | Confirmed |
| Suggested fix snippets correct/minimal | Yes | No — fixes not implemented | Unverified |
| PRR-001 line number in report | Cited line 227 (patch context) | Fixture file 48 lines; SQL at line 44 | Confirmed with line drift |

---

## Commands Used

```bash
# Blocking SQLi (unit script)
php tasks/Advanced/A5/proof/repro-sql-injection.php

# HTTP status + search (disposable copy; canonical fixture/post unchanged)
mkdir -p /tmp/a5-http && cp -R tasks/Advanced/A5/fixture/post/. /tmp/a5-http/
cd /tmp/a5-http && composer install && php -S 127.0.0.1:19805 -t public &
curl -si -X POST http://127.0.0.1:19805/contacts \
  -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com"}'
curl -si -X POST http://127.0.0.1:19805/contacts \
  -H "Content-Type: application/json" -d '{}'
curl -s -G "http://127.0.0.1:19805/contacts/search" \
  --data-urlencode "q=x' OR '1'='1"

# Static / structural checks on canonical fixture
grep -n api_secret tasks/Advanced/A5/fixture/post/config/app.php
ls tasks/Advanced/A5/fixture/post/tests 2>&1
find tasks/Advanced/A5/fixture/post -name '*Test.php'
find tasks/Advanced/A5/fixture/post/lib -name '*.php' 2>&1
find tasks/Advanced/A5/fixture/post/src tasks/Advanced/A5/fixture/post/public -name '*.php' | wc -l
```

---

## Differences Between Agent and Manual Review

**Agent detected correctly**

- All six blocking issues were manually confirmed; REQUEST_CHANGES verdict is consistent with reproduced SQLi.
- HTTP status regressions (200 vs 201, 400 vs 422) verified with curl against a disposable runtime copy.
- Structural gaps (no tests, CI lints empty `lib/`) verified on the canonical fixture tree.

**Required manual confirmation**

- PRR-001 required executable reproduction, not grep-only review — captured in [`repro-blocking-issue-1.txt`](repro-blocking-issue-1.txt).
- HTTP checks used isolated `/tmp/a5-http` copy so `fixture/post` stayed unchanged.

**Could not reproduce / not run**

- PRR-007 (PII logging) and PRR-009 (email validation) were not manually exercised.
- Agent-suggested fix code was not implemented or tested.
- PRR-008 verified by reading `.gitignore` only — no `touch .env` commit test.

**Remaining uncertainty**

- PRR-006: on macOS, `find lib` errors when directory is missing (exit 1) vs agent wording about exit 0 — core finding (CI never lints real sources) still holds.
- Line numbers in the agent report reflect patch context, not the standalone fixture file layout.

---

## Final Confidence

**High confidence** — Blocking security and correctness findings, plus verdict, were manually reproduced with execution evidence. **Medium** for non-blocking items (PRR-007–009) left unverified in this pass.

---

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [`repro-blocking-issue-1.txt`](repro-blocking-issue-1.txt) | SQL injection reproduction with exit code 1 |
| [`repro-sql-injection.php`](repro-sql-injection.php) | Runnable script against fixture `ContactRepository` |
| [`review-verdict-summary.md`](review-verdict-summary.md) | REQUEST CHANGES verdict with reproduction matrix |
