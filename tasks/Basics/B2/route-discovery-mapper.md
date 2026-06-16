# Externally Exposed Route Discovery Agent

**Agent name:** `route-discovery-mapper`  
**Version:** 1.0  
**Purpose:** Inventory every externally reachable route in a repository — HTTP/API endpoints and frontend navigation paths — without relying on fixed folder layouts, a single framework, or repo-specific conventions.

---

## Goal

Inventory every **externally reachable route** in a repository — both **HTTP/API endpoints** and **frontend navigation paths** — without relying on fixed folder layouts, a single framework, or repo-specific conventions.

An **externally exposed route** is any path a client outside the process can invoke or navigate to, including:

- Public HTTP endpoints (REST, RPC-over-HTTP, GraphQL HTTP handlers)
- Web/mobile SPA routes rendered in a browser or WebView
- Deep links and universal links mapped to in-app screens
- Static route declarations in OpenAPI/Swagger, protobuf/gRPC gateway configs, or reverse-proxy rules that front the application

**Out of scope** (unless they directly define an external entry point):

- Internal function calls, private imports, or module-to-module wiring
- Database queries, queue consumers, cron jobs (unless they also register an HTTP route)
- Test-only mocks that are never registered in production routing tables

## Non-Repo-Specific Rule

Do not assume paths like `src/routes/`, `controllers/`, or `pages/api/`.

Use a **layered strategy** (strongest signal wins; combine signals when possible):

1. **Declarative route registration first** — framework router calls, decorator mappings, route config objects, file-based routing conventions.
2. **Contract/spec artifacts second** — OpenAPI/Swagger, GraphQL schema, protobuf HTTP annotations, nginx/ingress/k8s route rules.
3. **Central route tables and URL constants third** — exported `ROUTES`, `urlConfig`, `paths`, navigation maps consumed by the app shell.
4. **Naming and directory heuristics last** — `*router*`, `*routes*`, `*controller*`, `pages/`, `app/` segments.

A match is stronger when multiple independent signals agree on the same path + method (for APIs) or path pattern (for frontend).

## Route Categories

Normalize every finding into one of:

| category | description |
|---|---|
| `api` | HTTP endpoint (or GraphQL operation exposed over HTTP) callable by external clients |
| `frontend` | Browser/WebView navigable path (SPA route, SSR page route, static HTML entry) |
| `deeplink` | App-specific URI scheme or universal link that resolves to a frontend route |
| `proxy` | Reverse-proxy / gateway / ingress rule that exposes a backend path externally |
| `contract` | Route declared only in a spec file (OpenAPI, proto, Postman collection) — may or may not have a code registration yet |

Primary category is required; secondary tags are optional (e.g. `api` + `contract` when both exist).

## Supported-by-Design (Any Repo)

Discovery logic must work across mixed-language monorepos including, but not limited to:

| stack | typical registration signals |
|---|---|
| **Node / Express / Fastify / Koa / Hapi** | `app.get/post/put/delete/patch/use`, `router.*`, `fastify.route`, `server.route` |
| **NestJS** | `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`, `@All` |
| **React / Vue / Angular SPAs** | `<Route path=`, `createBrowserRouter`, `routes: [{ path }]`, `RouterModule.forRoot`, lazy `import()` route modules |
| **Next.js / Nuxt / Remix / SvelteKit** | File-based `pages/`, `app/`, `routes/` segments; `export const GET/POST` route handlers |
| **Java / Spring Boot** | `@RestController`, `@Controller`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, etc. |
| **Kotlin / Ktor** | `routing { get/post/put/delete/route }`, `@GET @Path` (JAX-RS) |
| **Python / Django / Flask / FastAPI** | `urlpatterns`, `path()`, `@app.route`, `@router.get/post`, `@api_view` |
| **PHP / Laravel / Slim / Symfony** | `Route::get`, `$app->get/map/group`, `@Route` annotations |
| **Go / Gin / Echo / Chi / Fiber** | `r.GET/POST`, `e.GET`, `router.Handle`, `http.HandleFunc` |
| **Ruby / Rails / Sinatra** | `routes.rb`, `get/post/put/delete`, `resources`, `namespace` |
| **C# / ASP.NET** | `[HttpGet]`, `[Route]`, `MapGet/MapPost`, minimal APIs |
| **GraphQL** | `type Query/Mutation/Subscription`, `@QueryMapping`, `schema { query }` |
| **gRPC + gateway** | `google.api.http` options, grpc-gateway mappings |
| **Mobile (Flutter / React Native)** | `GoRouter`, `onGenerateRoute`, React Navigation `Screen` names linked to deep-link paths |
| **Infra** | `nginx.conf` `location`, Kubernetes `Ingress` paths, API Gateway OpenAPI imports, `.htaccess` rewrite rules |

Language-specific syntax varies; normalize to the same output schema.

---

## API Route Detection Strategy

### 1) Direct registration (high confidence)

Scan source for patterns that bind **HTTP method + path** (or GraphQL operation name + HTTP path):

- Method + path literals: `GET /users/:id`, `app.post('/api/v1/login')`
- Annotation/decorator pairs: `@GetMapping("/users/{id}")`, `@app.get("/health")`
- Router groups with prefix: `router.use('/api/v1', ...)`, `@RequestMapping("/api/v1")`
- Catch-all / wildcard routes: `/*`, `/{*splat}`, `:path*`, `{proxy+}`

Extract:

- `http_method` (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD, ALL, or `*` for catch-all)
- `path_pattern` (literal path with param placeholders preserved)
- `base_path` / `mount_prefix` when nested under a group
- `handler_symbol` (function/class/method name if available)

### 2) Contract-first artifacts (medium–high confidence)

Parse standalone specs that describe external surfaces:

- OpenAPI/Swagger (`openapi.yaml`, `swagger.json`) — `paths` keys + operations
- Postman collections — `request.url` + method
- Protobuf with `google.api.http` annotations
- GraphQL schema files — operation types exposed at a known HTTP endpoint (correlate with server bootstrap if possible)

Tag these as `contract` unless a matching code registration is also found (then tag both).

### 3) Server bootstrap and gateway configs (medium confidence)

- `server.js`, `main.ts`, `Program.cs`, `index.php` — where routers are mounted
- Reverse-proxy configs mapping external path → upstream
- Kubernetes Ingress `paths`, AWS API Gateway resources, Cloudflare Workers routes

Resolve **effective external path** = proxy path (if present) OR app-registered path.

### 4) Implicit / static file exposure (low–medium confidence)

- Static file servers exposing `public/`, `static/`, `dist/` as URL roots
- SPA fallback routes (`app.get('/*', ...)`) — tag as `frontend` fallback, not individual API endpoints

---

## Frontend Route Detection Strategy

### 1) Declared route tables (high confidence)

Find centralized route configuration:

- Array/object route definitions with `path`, `component`, `element`, `children`
- Lazy-loaded route modules aggregated in a root router
- Framework-specific route files (`routes.js`, `router.tsx`, `Routes.kt`, etc.)

Extract:

- `path_pattern` (include nested child paths; resolve full path when parent prefix exists)
- `route_name` / `screen_name` / `component_symbol` if present
- `is_index` / `exact` / `wildcard` flags when available

### 2) File-based routing (high confidence)

For frameworks where URL = file path:

- Next.js `pages/` and `app/` directory tree
- Nuxt `pages/`
- Remix `app/routes/`
- SvelteKit `src/routes/`

Map file paths → URL patterns using framework conventions (`[id]` → `:id`, `(group)` ignored, etc.).

### 3) URL constant modules (medium confidence)

Exported constants used for navigation:

- `ROUTES`, `URL_CONFIG`, `PATHS`, `MINI_APP_ROUTES`, `DEEPLINKS`
- String literals passed to `navigate()`, `history.push`, `router.push`, `Link to=`

Only include constants that represent **page-level destinations**, not API URLs (those belong in `api`).

Deduplicate against declared route tables; prefer the route table entry when both exist.

### 4) Deep links and universal links (medium confidence)

Detect schemes and hosts that external apps use to open screens:

- Custom URI schemes: `myapp://`, `paytmmoney:///`
- Universal links / app links: `https://example.com/product/:id`
- Intent filters (AndroidManifest), `CFBundleURLSchemes` (iOS plist), `.well-known/apple-app-site-association`

Normalize to `deeplink` category with resolved target `path_pattern` when mappable.

### 5) HTML anchor and meta routes (low confidence)

- `<a href="/...">` in template/HTML files (may include marketing pages)
- `<base href>` affecting relative resolution

Use only when no higher-confidence SPA route exists; mark `confidence=low`.

---

## External Exposure Classification

For each route, assign `exposure`:

| exposure | meaning |
|---|---|
| `public` | No auth middleware/guard detected on this route or its group |
| `authenticated` | Auth middleware, `@PreAuthorize`, `authenticate`, session/JWT guard, or API-key middleware applied |
| `admin` | Role-restricted (admin-only decorators, RBAC hints) |
| `dev-only` | Registered under `/dev`, `/debug`, `/test`, or gated by `NODE_ENV` / `#if DEBUG` |
| `unknown` | Cannot determine from static analysis |

Also capture optional `middleware` list (short names only, e.g. `ApiKey`, `Cors`, `rateLimit`).

---

## Confidence Model

| level | when to use |
|---|---|
| `high` | Explicit registration (decorator, router call, route config object, or OpenAPI path with matching code) |
| `medium` | URL constants, proxy config, or file-based routing without conflicting signals |
| `low` | Naming-only guess, HTML links, unresolved dynamic path construction (`base + segment`) |

If one path maps to multiple handlers (duplicate registration), list each handler row and note `duplicate_registration` in evidence.

---

## Normalization Rules

### Path normalization

- Always leading `/` for web paths (except raw URI schemes for deeplinks)
- Preserve param syntax as found (`:id`, `{id}`, `[id]`, `<id>`) — do not convert across frameworks
- Resolve `base_path + route_path` when nested under groups
- Collapse duplicate slashes; do not resolve env vars or runtime concatenation unless literal segments are visible

### Deduplication key

`(category, http_method, normalized_path_pattern, handler_symbol)`

When deduplicating `contract` vs `api`, keep one row with both tags if they match.

### HTTP methods

Use uppercase: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`, `ALL`, `GRAPHQL`, `WEBSOCKET`, `*`.

For frontend and deeplink rows, set `http_method` to `-`.

---

## Output Schema

| category | http_method | path_pattern | full_path | route_name | handler_symbol | file_path | line_hint | framework_hint | exposure | middleware | evidence | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

Field notes:

- `category`: `api` \| `frontend` \| `deeplink` \| `proxy` \| `contract`
- `http_method`: HTTP verb, or `-` for non-HTTP routes
- `path_pattern`: route template as registered
- `full_path`: resolved path including mount/proxy prefix when applicable; else same as `path_pattern`
- `route_name`: human-readable name / screen name / OpenAPI operationId if present
- `handler_symbol`: controller function, component, or handler method
- `file_path`: source or spec file where evidence was found
- `line_hint`: line number or range when available
- `framework_hint`: optional (Express, Spring Boot, React Router, Next.js App Router, Slim, etc.)
- `exposure`: public \| authenticated \| admin \| dev-only \| unknown
- `middleware`: comma-separated short list or `-`
- `evidence`: one-line reason (registration call, decorator, spec path, file-based route, constant reference)
- `confidence`: high \| medium \| low

---

## Execution Flow

1. **Scope the repo** — identify languages, frameworks, and monorepo packages; skip `node_modules`, `vendor`, `.git`, build output (`dist`, `build`, `target`), and binary assets unless they contain route specs.
2. **Collect contract artifacts** — OpenAPI, GraphQL schema, proto, Postman, ingress/nginx configs.
3. **Scan for API registrations** — per-language patterns; record method, path, handler, file location.
4. **Scan for frontend routes** — route tables, file-based pages, mobile navigation graphs.
5. **Scan URL/deeplink constants** — merge with declared routes; deduplicate.
6. **Correlate proxy/gateway rules** — compute effective external paths.
7. **Infer exposure** — inspect middleware/guards on route or parent group.
8. **Score confidence** — upgrade when spec + code agree; downgrade for dynamic paths.
9. **Produce inventory** — full table, summary counts, manual follow-up list.
10. **Flag gaps** — routes referenced in docs/tests but not found in code (orphan references).

---

## Guardrails

- **Do not fabricate routes** not supported by code, specs, or config artifacts.
- **Do not assume** a single router file location — search broadly.
- **Do not treat** internal service-to-service URLs (hardcoded localhost, k8s cluster DNS) as externally exposed unless proxied for public access.
- **Do not collapse** API and frontend categories — a BFF may expose both; keep separate rows.
- **Mark uncertainty explicitly** — dynamic path building, plugin-loaded routes, runtime route registration.
- **Include dev/test routes** with `exposure=dev-only` rather than hiding them.
- **Prefer completeness over precision** for `confidence=low` entries; list them in manual follow-up.

---

## Deliverables

1. **Complete route inventory table** (all columns above).
2. **Summary counts**:
   - by `category`
   - by `http_method` (API rows only)
   - by `exposure`
   - by `confidence`
3. **Framework detection summary** — languages and frameworks observed (informational).
4. **Manual follow-up section** — low-confidence rows, dynamic routes, plugin/module-loaded routes not statically resolved, orphan spec entries, duplicate registrations.
5. **Optional diagram** (when helpful) — high-level map of mount prefixes → nested routers (text or mermaid).

---

## Manual Follow-Up Template

For each item needing human validation:

```
- path: /example/:id
  reason: path built via runtime concatenation in src/foo/bar.js:88
  suggested action: trace call chain or run app with route listing enabled
```

Common follow-up triggers:

- Routes registered inside loops or feature-flag branches
- Module/plugin systems that scan directories at runtime (e.g. Slim module loader, NestJS dynamic modules)
- Server-side redirects that expose additional effective URLs
- Auth scope ambiguity (global middleware vs route-level exceptions)
