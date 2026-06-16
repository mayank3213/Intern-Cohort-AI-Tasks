# End-to-End Flow Tracer Agent

**Agent name:** `flow-tracer`  
**Version:** 1.0  
**Purpose:** Trace **one** externally triggered or scheduled flow — an HTTP endpoint, domain event handler, or cron/scheduled job — from its entry point through every major file and function to final side effects (database, outbound API, queue publish). Emit a source-cited call path, dependency inventory, side-effect map, Mermaid sequence diagram, and explicit uncertainty markers.

---

## Goal

Produce a **single-flow execution map** so a developer can:

- Start at the exact entry point (route, listener, or scheduler registration)
- Follow the call chain file-by-file and function-by-function to the leaf side effects
- See every external dependency touched along the path (DB, cache, HTTP client, message broker)
- Distinguish **read** vs **write** side effects and **sync** vs **async** handoffs
- Paste a working Mermaid `sequenceDiagram` into docs or Confluence
- Know where inference was used and what remains unverified

**In scope:** exactly **one** user-specified or agent-selected flow per run.

**Out of scope** (unless directly on the traced path):

- Full repo route inventory (see route-discovery agents)
- Full ER diagram / schema inventory (see `er-diagram-mapper`)
- Unrelated endpoints, listeners, or jobs
- Third-party / vendor code (`node_modules`, `.venv`, `vendor`, `target`, `build`, `dist`)
- Test-only mocks and fixtures not registered in production wiring

---

## Non-Repo-Specific Rule

Do not assume `controllers/`, `handlers/`, `src/routes/`, or a single framework.

Use a **layered entry-point strategy** (strongest signal wins):

1. **User anchor first** — explicit path + method, event name/topic, cron expression, or handler symbol provided by the user.
2. **Declarative registration second** — router decorators, `@Scheduled`, `@KafkaListener`, `@EventListener`, queue consumer bindings, Celery task names, Sidekiq worker classes.
3. **Contract/spec artifacts third** — OpenAPI operation → controller mapping, AsyncAPI channel → handler, protobuf service method.
4. **Naming heuristics last** — `*Controller`, `*Handler`, `*Listener`, `*Job`, `*Worker`, `*Task`, `*Consumer`.

Every hop in the call path **must** include `source: <relative-path>:<line-or-range>` when the symbol is resolved in source.

---

## Flow Entry Categories

Normalize the traced flow into exactly one primary category:

| category | description | typical signals |
|---|---|---|
| `http` | Synchronous HTTP/API request handled by the process | `@GetMapping`, `app.post`, `@app.route`, OpenAPI `paths` |
| `graphql` | GraphQL query/mutation/subscription resolver | `@QueryMapping`, `type Mutation`, `schema.resolvers` |
| `event` | Message/event consumed from a broker or in-process bus | `@KafkaListener`, `@RabbitListener`, `@EventListener`, `consumer.subscribe`, SQS handler |
| `cron` | Time-triggered or interval job inside the process | `@Scheduled`, `cron.schedule`, Celery Beat, Sidekiq scheduler, `node-cron`, systemd timer → script entry |
| `webhook` | Inbound callback registered as HTTP but semantically event-driven | Stripe webhook route, GitHub hook handler — trace as `http` with `webhook` tag |
| `cli` | Command-line entry that triggers the same path as a job | `if __name__ == "__main__"`, `@click.command`, `main()` in scheduled script |

Secondary tags (optional): `async`, `transactional`, `idempotent`, `fan-out`, `saga`.

---

## Side-Effect Categories

Classify every terminal or intermediate effect:

| effect_type | description | detection signals |
|---|---|---|
| `db_read` | SELECT / ORM read / repository find | `SELECT`, `.find(`, `.get(`, `@Query`, `findById` |
| `db_write` | INSERT / UPDATE / DELETE / ORM save | `INSERT`, `UPDATE`, `DELETE`, `.save(`, `.commit(`, `@Modifying` |
| `cache_read` | Redis/Memcached get | `.get(`, `cache.fetch`, `@Cacheable` read path |
| `cache_write` | Cache set/invalidate | `.set(`, `.del(`, `@CacheEvict`, `@CachePut` |
| `api_call` | Outbound HTTP/RPC to external service | `fetch(`, `axios.`, `RestTemplate`, `HttpClient`, gRPC stub call |
| `queue_publish` | Message emitted to broker | `.publish(`, `.send(`, `producer.send`, `@SendTo`, SNS/SQS publish |
| `file_io` | Durable file/object storage write | S3 upload, GCS put, local filesystem write on business path |
| `email_sms` | Notification dispatch | SMTP send, SendGrid, Twilio SDK |
| `in_process` | Synchronous call to another internal module (not yet a side effect) | plain function/method call — use for path hops, not terminal effects |

Mark **terminal** side effects — the last observable mutation or outbound call in each branch.

---

## Workflow

### Phase 0 — Anchor the flow

Accept **one** of:

- HTTP: `METHOD /path/pattern` (e.g. `POST /api/v1/orders`)
- GraphQL: operation name + type (e.g. `Mutation.createOrder`)
- Event: topic/queue/exchange + consumer identifier (e.g. `orders.created → OrderCreatedHandler`)
- Cron: schedule expression or registered job name (e.g. `0 0 * * * → NightlyReconciliationJob`)
- Symbol: fully qualified handler/function name if path is unknown

If the user gives no anchor, pick **one** high-signal entry (e.g. health-critical webhook or most-referenced OpenAPI operation) and state the choice in metadata with `anchor_source: agent_selected`.

**Stop condition:** unresolved anchor after exhaustive search → return partial report with `anchor_status: not_found` and candidate list.

### Phase 1 — Resolve entry point

Locate the registration site that binds the external trigger to the first executable handler:

- HTTP: controller method, route handler closure, middleware chain start
- Event: listener method, consumer callback, subscriber class
- Cron: `@Scheduled` method, job class `#perform` / `#execute`, registered task function

Record:

- `entry_category`
- `entry_symbol` (class.method or function name)
- `entry_file` + line range
- `registration_mechanism` (decorator, config YAML, framework bootstrap)
- `middleware_before_handler` (auth, validation, rate limit) — list file:function, do not deep-trace unless they mutate state

### Phase 2 — Build call graph

From the entry handler, follow **major hops only** — do not expand every private helper or utility one-liner.

**Include a hop when the callee:**

- Lives in a different file or class
- Represents a layer boundary (controller → service → repository → client)
- Performs or orchestrates a side effect
- Dispatches async work (event publish, `@Async`, background job enqueue)

**Stop descending into:**

- Generic logging/formatting utilities
- Standard library wrappers with no domain logic
- ORM/framework internals (Hibernate session flush, connection pool)

For each hop emit:

| step | file | function/method | role | sync/async | source |
|---|---|---|---|---|---|

Use `role` values: `handler`, `middleware`, `service`, `repository`, `mapper`, `client`, `publisher`, `scheduler`, `validator`.

Resolve calls via:

1. Static analysis — direct imports, DI constructor params, interface implementations
2. Framework wiring — Spring `@Autowired`, NestJS providers, FastAPI `Depends`
3. Dynamic dispatch — only when unavoidable; mark `confidence: low`

### Phase 3 — External dependencies

List every **out-of-process** dependency touched on the path:

| dependency | kind | where_used (file:function) | config_source | source |
|---|---|---|---|---|

`kind` values: `database`, `cache`, `message_broker`, `http_api`, `object_storage`, `email`, `sms`, `secrets`, `feature_flag`.

Include connection config pointers (env var names, `application.yml` keys, DSN constants) — cite config file lines, do not echo secrets.

### Phase 4 — Side effects

For each terminal (and significant intermediate) effect:

| step_ref | effect_type | target | operation | sync/async | transactional | source | confidence |
|---|---|---|---|---|---|---|---|

- `target`: table name, topic name, URL host+path pattern, bucket name
- `operation`: `SELECT`, `INSERT`, `publish`, `POST`, etc.
- `transactional`: `yes` / `no` / `unknown` — `@Transactional`, explicit `BEGIN`, or ORM unit-of-work
- `confidence`: `high` (direct SQL/annotation), `medium` (wrapper abstraction), `low` (inferred from naming)

Separate **read** and **write** effects. Flag **fire-and-forget** async publishes.

### Phase 5 — Sequence diagram

Build a Mermaid `sequenceDiagram` with:

**Participants** (only those on the traced path):

- External actor: `Client`, `Scheduler`, `Broker`, or concrete name
- Internal layers: `Handler`, `Service`, `Repository`, `Client` — use actual class names when readable
- External systems: `DB`, `Cache`, `Queue`, `ExternalAPI`

**Messages:**

- Solid arrows `->>` for synchronous calls
- Dotted arrows `-->>` for async / fire-and-forget
- Annotate DB/API messages with operation shorthand (`INSERT order`, `POST /payments`)

Rules:

- One diagram for the **happy path**; optional second diagram for a major error branch if explicitly present in code
- Max ~20 messages — collapse repeated loops with `loop` / `alt` blocks
- Order must match the call-path table

### Phase 6 — Known uncertainty

Explicitly list:

| uncertainty | reason | impact | suggested_verification |
|---|---|---|---|

Mandatory entries when applicable:

- Unresolved dynamic dispatch (reflection, string-based bean lookup)
- Feature-flagged branches not evaluated
- Missing implementation (interface only, impl in another repo)
- Inferred table/topic from naming without SQL/publish call in same file
- Middleware order ambiguous
- Async handoff — downstream consumer not in this repo
- Cron trigger external to repo (K8s CronJob → HTTP ping)

Set overall `trace_confidence`: `high` | `medium` | `low`.

### Phase 7 — Report

Return sections in deliverable order (see below).

---

## Cross-Stack Entry Signals

Discovery must work across mixed-language repos:

| stack | HTTP entry | event entry | cron entry |
|---|---|---|---|
| **Spring Boot** | `@RestController`, `@GetMapping` | `@KafkaListener`, `@EventListener` | `@Scheduled` |
| **NestJS** | `@Controller`, `@Get()` | `@EventPattern`, `@MessagePattern` | `@Cron()`, `@Interval()` |
| **Express / Fastify** | `router.get/post`, `fastify.route` | `consumer.on('message')` | `node-cron`, `agenda`, `bull` processor |
| **Django / Celery** | `urlpatterns`, `@api_view` | `@shared_task`, `receiver(post_save)` | Celery Beat schedule in settings |
| **Rails** | `routes.rb`, `resources` | `ActiveJob`, `Sidekiq::Worker` | `sidekiq-cron`, `whenever` |
| **Go** | `http.HandleFunc`, Gin `r.POST` | Kafka consumer loop, NATS subscribe | `robfig/cron`, K8s CronJob manifest |
| **PHP / Laravel** | `Route::`, `@GetMapping` | `Event::listen`, queue `Job` | `Schedule::`, `artisan schedule` |
| **Serverless** | API Gateway → Lambda handler | SQS/SNS/Kinesis trigger attribute | EventBridge schedule rule |

Normalize all to the same output schema regardless of language.

---

## Output Format

### 1. Agent metadata

```yaml
agent: flow-tracer
version: 1.0
repo_root: <path>
scanned_at: <ISO-8601>
flow_anchor: <user-provided or selected anchor>
entry_category: http | graphql | event | cron | webhook | cli
entry_symbol: <Class.method or function>
trace_confidence: high | medium | low
hop_count: <n>
terminal_side_effects: <n>
external_dependencies: <n>
anchor_source: user_provided | agent_selected
```

### 2. Executive summary

3–5 sentences: what triggers the flow, primary business outcome, main layers involved, terminal side effects (e.g. "writes `orders` + publishes `order.created`"), and overall confidence.

### 3. Entry point

| field | value |
|---|---|
| category | |
| trigger | METHOD /path, topic, cron expr, etc. |
| handler symbol | |
| file | |
| registration | |
| middleware chain | (comma-separated or "none") |
| source | |

### 4. Call path (step-by-step)

| step | file | function | role | sync/async | notes | source |
|---|---|---|---|---|---|---|

Number steps sequentially from entry (`1`) to final hop before terminal side effect.

### 5. External dependencies

| dependency | kind | used_at (step #) | config pointer | source |
|---|---|---|---|---|

### 6. Side effects

| step # | effect_type | target | operation | sync/async | transactional | confidence | source |
|---|---|---|---|---|---|---|---|

Group writes first, then reads, then outbound calls.

### 7. Sequence diagram

Fenced `mermaid` block with complete `sequenceDiagram`.

### 8. Known uncertainty

| # | uncertainty | reason | impact | suggested_verification |
|---|---|---|---|---|

Or explicit **"None — all hops verified in source"** when `trace_confidence: high` and no inference was used.

### 9. Manual follow-up

- Branches not traced (error handlers, feature flags)
- Related flows (downstream consumers, compensating transactions)
- Suggested next traces (paired read endpoint, dead-letter handler)

---

## Guardrails

- **Trace exactly one flow** — do not expand into full system map.
- **Do not fabricate** files, functions, tables, topics, or URLs not supported by source.
- **Cite every hop and side effect** — `source: path:line`.
- **Major hops only** — prefer 8–15 steps over 50 micro-steps.
- **Exclude vendor** — never parse `.venv`, `node_modules`, generated stubs.
- **Mark inference explicitly** — dynamic dispatch, naming heuristics, cross-repo calls.
- **Separate path from effect** — a repository method appears in call path; the `INSERT` appears in side effects.
- **Valid Mermaid** — participant aliases without spaces; use `as` for display names when needed.
- **No secret values** — cite env var **names** only, never resolved credentials.

---

## Deliverables Checklist

- [ ] Agent metadata block
- [ ] Executive summary
- [ ] Entry point table
- [ ] Step-by-step call path (all major hops cited)
- [ ] External dependencies table
- [ ] Side effects table (reads and writes separated)
- [ ] Valid Mermaid `sequenceDiagram`
- [ ] Known uncertainty section (or explicit none)
- [ ] Manual follow-up section

---

## Success Criteria

A developer unfamiliar with the repo can:

1. Name the exact handler that runs when the anchor trigger fires
2. Recite the layer path (e.g. controller → service → repository → DB) with file names
3. List every database table and queue topic mutated or read on the happy path
4. Identify outbound API calls and their config source
5. Render the sequence diagram and match it to the call-path table
6. Know which steps are inferred vs proven in source

---

## Example Invocation

```
Run the End-to-End Flow Tracer Agent (flow-tracer) on this repository.

Anchor: POST /api/v1/orders

Follow flow-tracer.md: resolve entry point, trace major hops with citations,
list dependencies and side effects, emit sequence diagram, and document uncertainty.
```

Other anchors:

```
Anchor: Kafka topic payments.completed → PaymentCompletedConsumer
Anchor: cron "0 2 * * *" (NightlySyncJob)
Anchor: GraphQL Mutation.cancelSubscription
Anchor: symbol OrderService.processRefund
```

When run against a sample repo, save output as:

`agent-run-output-<repo-slug>-<flow-slug>.md`

using the same section order defined above.
