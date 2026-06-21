# A5 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Fixture

| Field | Value |
|-------|-------|
| Base | `tasks/Advanced/A4/starter/` |
| Patch | `tasks/Advanced/A5/fixture/agent-change.patch` |
| PR description | `tasks/Advanced/A5/fixture/PR_DESCRIPTION.md` |

Apply sandbox (optional): `./scripts/apply-fixture.sh` → `fixture/sandbox/`

## Expected issue list (minimum 8)

| ID | Dimension | Severity | Blocking | Title | Location |
|----|-----------|----------|----------|-------|----------|
| PRR-001 | security | critical | **blocking** | SQL injection via string-concatenated search query | `src/ContactRepository.php` — `search()` builds `$sql` with unescaped `$term` |
| PRR-002 | security | critical | **blocking** | Hardcoded live API secret committed in config | `config/app.php` — `api_secret` => `sk-live-agent-leaked-key-...` |
| PRR-003 | correctness | major | **blocking** | POST `/contacts` returns **200** instead of **201** Created | `src/App.php` — `$this->json(200, ...)` on create |
| PRR-004 | correctness | major | **blocking** | Validation failure returns **400**; baseline/API contract used **422** | `src/App.php` — missing fields branch |
| PRR-005 | test | major | **blocking** | No automated tests for new search endpoint or SQLite repository | patch adds no `tests/` or PHPUnit config |
| PRR-006 | test | major | **blocking** | CI lints non-existent `lib/` directory — never checks `src/` or `public/` | `.github/workflows/php-syntax.yml` — `find lib` |
| PRR-007 | security | major | non-blocking | Logs full request payload (PII/email) at info level | `src/App.php` — `payload` => `$body` in logger |
| PRR-008 | maintainability | major | non-blocking | `.gitignore` omits `.env` while secrets live in committed PHP config | `.gitignore` vs `config/app.php` |
| PRR-009 | correctness | major | non-blocking | No email format validation — accepts any string | `src/App.php` POST handler |
| PRR-010 | maintainability | minor | non-blocking | README still claims PHP 5.6+ but Composer requires ^8.1 | `README.md` unchanged vs `composer.json` |

## Expected verdict

**REQUEST_CHANGES** — at least 3 blocking issues (SQLi, secret, CI/test gaps).

`APPROVE_WITH_NOTES` only if candidate marks SQLi/secret as blocking with clear fixes.

## Verification steps (reference)

| Issue | Verify |
|-------|--------|
| PRR-001 | `' OR '1'='1` in `q` param alters query; fix: prepared statements |
| PRR-002 | `grep api_secret config/app.php`; fix: env var + `.env.example` |
| PRR-003 | `curl -i -X POST .../contacts` → expect 201, patch returns 200 |
| PRR-006 | Inspect workflow `find lib`; fix: `find src public` |
| PRR-005 | No test files in patch; fix: add PHPUnit smoke tests |

## Pass criteria

- [ ] ≥5 issues with file:line citations from patch
- [ ] Identifies SQL injection (blocking)
- [ ] Identifies hardcoded secret (blocking)
- [ ] Identifies wrong HTTP status and/or broken CI (blocking)
- [ ] Suggested fix per blocking issue
- [ ] Verdict consistent with blocking findings

## Out of scope (do not require)

- Demanding full Slim migration
- Re-reviewing unchanged `example-nginx.conf` unless linked to PR scope creep
- Requiring performance analysis of SQLite for this small fixture

## Sandbox smoke (optional grader check)

```bash
./scripts/apply-fixture.sh
cd fixture/sandbox
composer install
php -S 127.0.0.1:8080 -t public
curl -s 'http://127.0.0.1:8080/contacts/search?q=test'
```
