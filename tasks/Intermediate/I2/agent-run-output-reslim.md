# End-to-End Flow Trace — reSlim

```yaml
agent: flow-tracer
version: 1.0
repo_root: /Users/mayanksrivastava/Desktop/agent/reSlim
scanned_at: 2026-06-17
flow_anchor: POST /user/login
entry_category: http
entry_symbol: closure → classes\User::login
trace_confidence: high
hop_count: 12
terminal_side_effects: 4
external_dependencies: 1
anchor_source: agent_selected
```

## Executive summary

reSlim is a PHP Slim 3 REST API. With no user anchor provided, this trace follows **`POST /user/login`** — the primary authentication entry point. A client posts `Username` and `Password`; Slim routes through validation middleware, then `User::login()` performs three read queries against `user_data` (existence, active status, password hash) before `Auth::generateToken()` inserts a new row into `user_auth` inside a PDO transaction. The response is JSON-encoded and returned with CORS headers. No cache, queue, or outbound HTTP calls participate on the happy path. A MariaDB/MySQL event (`delete_all_expired_auth`) purges stale tokens daily but is **outside** this request path.

---

## Entry point

| field | value |
|---|---|
| category | `http` |
| trigger | `POST /user/login` |
| handler symbol | anonymous closure → `classes\User::login()` |
| file | `src/routers/user.router.php:204-214` |
| registration | `$app->post('/user/login', …)` loaded via `Scanner::fileSearch` in `src/app/app.php:55-58` |
| middleware chain | global `\Slim\HttpCache\Cache` → `ValidateParam(Username)` → `ValidateParam(Password)` → handler |
| bootstrap | `src/api/index.php` → `src/app/app.php` → `$app->run()` |
| source | `src/routers/user.router.php:204-214`, `src/api/index.php:2`, `src/app/app.php:70` |

---

## Call path (step-by-step)

| step | file | function | role | sync/async | notes | source |
|---|---|---|---|---|---|---|
| 1 | `src/api/index.php` | (require) | handler | sync | HTTP front controller; nginx `try_files` → `api/index.php` per `src/example-nginx.conf:17-18` | `src/api/index.php:2` |
| 2 | `src/app/app.php` | `$app->run()` | handler | sync | Slim bootstrap: config, DI, router scan, dispatch | `src/app/app.php:70` |
| 3 | `src/app/dependencies.php` | `\Slim\HttpCache\Cache::__invoke` | middleware | sync | Global HTTP cache middleware on all routes | `src/app/dependencies.php:9` |
| 4 | `src/classes/middleware/ValidateParam.php` | `ValidateParam::__invoke` → `validate` | middleware | sync | Validates `Username` body field (1–50 chars, required) | `src/routers/user.router.php:214`, `ValidateParam.php:48-71` |
| 5 | `src/classes/middleware/ValidateParam.php` | `ValidateParam::__invoke` → `validate` | middleware | sync | Validates `Password` body field (1–250 chars, required) | `src/routers/user.router.php:213`, `ValidateParam.php:48-71` |
| 6 | `src/routers/user.router.php` | route closure | handler | sync | Instantiates `User`, maps POST body, calls `login()` | `src/routers/user.router.php:204-211` |
| 7 | `src/classes/User.php` | `User::login` | service | sync | Username regex gate; orchestrates registration/status/password checks | `src/classes/User.php:1297-1333` |
| 8 | `src/classes/User.php` | `User::isRegistered` | repository | sync | `SELECT` from `user_data` by username | `src/classes/User.php:418-432` |
| 9 | `src/classes/User.php` | `User::isActivated` | repository | sync | `SELECT` from `user_data` where `StatusID = '1'` | `src/classes/User.php:489-503` |
| 10 | `src/classes/User.php` | `User::isPasswordMatch` | repository | sync | `SELECT Password` from `user_data`; delegates verify | `src/classes/User.php:509-526` |
| 11 | `src/classes/Auth.php` | `Auth::verifyPassword` | service | sync | PHP `password_verify($username.$password, $hash)` — no I/O | `src/classes/Auth.php:50-57` |
| 12 | `src/classes/Auth.php` | `Auth::generateToken` | service | sync | `encodeAPIKey` → `INSERT user_auth` in transaction | `src/classes/Auth.php:175-208` |
| 13 | `src/classes/Auth.php` | `Auth::encodeAPIKey` → `BaseConverter::convertFromBinary` | mapper | sync | Builds RS_Token from username + timestamp | `src/classes/Auth.php:65-67`, `177` |
| 14 | `src/classes/JSON.php` | `JSON::encode` | mapper | sync | Serializes result array to JSON string | `src/classes/User.php:1332` |
| 15 | `src/classes/Cors.php` | `Cors::modify` | handler | sync | Sets status 200, JSON content-type, CORS headers | `src/routers/user.router.php:212`, `Cors.php:65-90` |

---

## External dependencies

| dependency | kind | used_at (step #) | config pointer | source |
|---|---|---|---|---|
| MySQL / MariaDB (`reSlim` database) | `database` | 8–12 | `$config['db']['host']`, `user`, `pass`, `dbname` in `src/config.php:58-61` | `src/app/dependencies.php:98-118` |
| PHP `password_verify` (stdlib) | in-process crypto | 11 | N/A — no network | `src/classes/Auth.php:53` |
| Monolog file logger | `file_io` (errors only) | — (not on happy path) | `$container['logger']` → `../logs/app.log` | `src/app/dependencies.php:88-94` |

**Not on this path (configured but unused for login):**

| dependency | kind | note | source |
|---|---|---|---|
| Redis (Predis) | `cache` | `REDIS_ENABLE` false by default | `src/config.php:145-147`, `src/app/app.php:26-28` |
| SMTP / PHPMailer | `email` | Used by forgot-password, not login | `src/config.php:104-112`, `dependencies.php:146` |
| Slave DB (`dbslave`) | `database` | Container registered; login uses `$this->db` (master) | `src/app/dependencies.php:122-143` |

---

## Side effects

### Writes (terminal)

| step # | effect_type | target | operation | sync/async | transactional | confidence | source |
|---|---|---|---|---|---|---|---|
| 12 | `db_write` | `user_auth` | `INSERT` (Username, RS_Token, Created, Expired +7 days) | sync | yes (`beginTransaction` / `commit`) | high | `src/classes/Auth.php:178-198` |

### Reads

| step # | effect_type | target | operation | sync/async | transactional | confidence | source |
|---|---|---|---|---|---|---|---|
| 8 | `db_read` | `user_data` | `SELECT Username WHERE Username = :username` | sync | no | high | `src/classes/User.php:421-426` |
| 9 | `db_read` | `user_data` | `SELECT StatusID WHERE StatusID='1' AND Username = :username` | sync | no | high | `src/classes/User.php:491-496` |
| 10 | `db_read` | `user_data` | `SELECT Password WHERE Username = :username` | sync | no | high | `src/classes/User.php:511-518` |

### Related but out-of-path

| effect_type | target | operation | note | source |
|---|---|---|---|---|
| `db_write` | `user_auth` | `DELETE` expired rows | MariaDB scheduled event, not invoked by login request | `resources/database/event_delete_all_expired_auth_scheduler.sql:1-6` |

---

## Sequence diagram

```mermaid
sequenceDiagram
    participant Client
    participant Nginx
    participant Slim as Slim App
    participant HttpCache as HttpCache Middleware
    participant ValUser as ValidateParam Username
    participant ValPass as ValidateParam Password
    participant Route as user.router closure
    participant User as User service
    participant Auth as Auth service
    participant DB as MySQL user_data / user_auth

    Client->>Nginx: POST /user/login {Username, Password}
    Nginx->>Slim: api/index.php → app.php → run()
    Slim->>HttpCache: dispatch middleware
    HttpCache->>ValUser: next()
    ValUser->>ValPass: validate Username OK
    ValPass->>Route: validate Password OK
    Route->>User: login()
    User->>DB: SELECT user_data (isRegistered)
    DB-->>User: row exists
    User->>DB: SELECT user_data StatusID=1 (isActivated)
    DB-->>User: active
    User->>DB: SELECT user_data Password (isPasswordMatch)
    DB-->>User: password hash
    User->>Auth: verifyPassword (password_verify)
    Auth-->>User: match
    User->>Auth: generateToken(db, username)
    Auth->>Auth: encodeAPIKey(username + timestamp)
    Auth->>DB: BEGIN; INSERT user_auth
    DB-->>Auth: commit
    Auth-->>User: {status, token, code}
    User-->>Route: JSON::encode(data)
    Route->>Client: Cors::modify 200 JSON + token
```

---

## Known uncertainty

| # | uncertainty | reason | impact | suggested_verification |
|---|---|---|---|---|
| 1 | Username casing mismatch | `isRegistered()` lowercases username (`strtolower`) but `isActivated()` and `isPasswordMatch()` bind `$this->username` unchanged | Login may fail for mixed-case usernames stored lowercase | Integration test with mixed-case POST body |
| 2 | Web server routing | `example-nginx.conf` rewrites all paths to `api/index.php`; actual deployment may differ | Entry URL prefix may vary | Confirm live nginx/apache rules |
| 3 | DB load balancer | `$config['db']['host']` may be an array; `mt_rand` picks host per request | Login reads/writes may hit different master nodes if misconfigured | Inspect production `config.php` |
| 4 | LazyPDO connection timing | PDO connection deferred until first query | No functional impact; connection step not visible in call stack | Trace with DB query logging |
| 5 | HttpCache on POST | Global `\Slim\HttpCache\Cache` wraps all routes including POST login | Unlikely to cache POST responses; behavior depends on Slim HttpCache internals | Capture response headers on live POST |
| 6 | Token expiry cleanup | `delete_all_expired_auth` event runs daily in DB, not in PHP | Expired tokens remain until event fires (+7 day grace in DELETE predicate) | Confirm event scheduler enabled in MariaDB |

Overall **`trace_confidence: high`** — all happy-path hops and SQL are directly visible in source; uncertainties are deployment/edge-case only.

---

## Manual follow-up

- **Error branches not traced:** invalid username format (`RS804`), not registered (`RS902`), inactive account (`RS906`), wrong password (`RS903`), validation failure (`RS801`), PDO exception on token insert.
- **Paired flows worth tracing next:**
  - `POST /user/logout` → `Auth::clearToken` (DELETE from `user_auth`)
  - `POST /user/register` → INSERT `user_data`
  - `GET /user/verify/{token}` → `Auth::validToken` (may hit auth cache if enabled)
- **Cron note:** The only scheduled job in repo SQL is `delete_all_expired_auth` (daily purge of `user_auth`); it is database-native, not a PHP cron entry point.
