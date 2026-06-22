# Known Uncertainties — POST /user/login flow trace

Source report: `tasks/Intermediate/I2/agent-run-output-reslim.md`  
Proof verification: `tasks/Intermediate/I2/proof/flow-entry-point.txt`  
Repository: `extras/cloned-repos/reSlim` (git submodule)

All hops on the happy path were re-verified with ripgrep against source on 2026-06-22. Uncertainties below are explicit gaps that static analysis cannot close.

---

## Unknowns

* **Username casing mismatch** — `isRegistered()` lowercases the username before the SQL bind (`User.php:419-425`), but `isActivated()` and `isPasswordMatch()` bind `$this->username` unchanged (`User.php:495`, `User.php:515`). Login may fail for mixed-case POST bodies when stored usernames are lowercase. Not proven or disproven without an integration test.

* **Web server routing at runtime** — `example-nginx.conf:18` rewrites all paths to `/api/index.php`, but production nginx/apache rules are not in this repo. The URL prefix seen by Slim may differ from the example config.

* **DB host load balancing** — When `$config['db']['host']` is an array, `dependencies.php:102-108` picks a host via `mt_rand`. Which physical node serves login reads/writes in production cannot be determined from source alone.

* **LazyPDO connection timing** — PDO is wrapped in `LazyPDO` (`dependencies.php:108-114`). The TCP/MySQL handshake is deferred until the first query; it does not appear as a separate hop in the call stack.

* **HttpCache behavior on POST** — Global `\Slim\HttpCache\Cache` wraps all routes including POST login (`dependencies.php:9`). Whether Slim HttpCache modifies POST response headers or caching behavior was not traced into vendor code (`vendor/slim/...`).

* **Token expiry cleanup path** — `resources/database/event_delete_all_expired_auth_scheduler.sql` defines a MariaDB scheduled event that purges expired `user_auth` rows. This runs outside the PHP request path; scheduler enablement in production is unknown.

* **Error branches not traced** — Invalid username format (`RS804`), not registered (`RS902`), inactive account (`RS906`), wrong password (`RS903`), validation failure (`RS801`), and PDO exception on token insert were not walked hop-by-hop in proof artifacts.

* **Redis / SMTP / slave DB** — Registered in config and DI but not invoked on the login happy path. Whether feature flags or runtime config enable them in some deployments is unknown.

---

## Assumptions

* **Endpoint inferred from router registration** — `POST /user/login` is bound at `user.router.php:204` via `$app->post(...)`. No OpenAPI spec was used; the path string in source is taken as authoritative.

* **Middleware order from Slim `->add()` chain** — Password validator is added first (`:213`), Username second (`:214`). Slim executes route middleware in reverse registration order, so Username runs before Password before the handler. Order was inferred from Slim 3 middleware stacking convention, not runtime-instrumented.

* **Database tables from inline SQL** — Table names `user_data` and `user_auth` come from literal SQL in `User.php` and `Auth.php`, not from an ORM mapping layer (reSlim uses raw PDO).

* **Nginx as front door** — Sequence diagram includes Nginx based on `example-nginx.conf`. Apache, PHP built-in server, or other proxies are possible but not documented in repo.

* **repo_root path in original report** — `agent-run-output-reslim.md` metadata cites `repo_root: .../agent/reSlim`; the submodule lives at `extras/cloned-repos/reSlim`. Proof commands use the submodule path where source files actually exist.

---

## Confidence

| Component              | Confidence | Rationale |
| ---------------------- | ---------- | --------- |
| Router registration    | High       | `$app->post('/user/login', …)` at `user.router.php:204`; closure calls `User::login()` at `:211` |
| Bootstrap chain        | High       | `api/index.php:2` → `app.php:70` `$app->run()`; routers loaded via `Scanner::fileSearch` at `:55-58` |
| ValidateParam middleware | High     | `->add(ValidateParam …)` at `:213-214`; `__invoke` at `ValidateParam.php:48-71` |
| User service (login)   | High       | `User::login()` at `:1297`; calls `isRegistered` → `isActivated` → `isPasswordMatch` → `Auth::generateToken` |
| Repository reads (user_data) | High | Three explicit `SELECT … FROM user_data` at `:421-426`, `:491-496`, `:511-518` |
| Auth token write (user_auth) | High | `INSERT INTO user_auth` inside transaction at `Auth.php:178-198` |
| JSON response encoding | High       | `JSON::encode($data,true)` at `User.php:1332` |
| CORS response headers  | High       | `Cors::modify($response,$body,200)` at `user.router.php:212`; implementation at `Cors.php:65-94` |
| Database interaction   | Medium     | SQL and PDO calls are visible; connection host selection, LazyPDO deferral, and live schema constraints are not runtime-verified |
| Web server / deployment | Low       | Only example nginx config present; actual deployment routing unknown |
| External integrations  | Low        | No outbound HTTP, queue, or email on login happy path; Redis/SMTP configured but unused here |

**Overall trace confidence: High** for happy-path hops and SQL (matches `agent-run-output-reslim.md`). Remaining gaps are deployment, edge-case, and vendor-internal behavior only.
