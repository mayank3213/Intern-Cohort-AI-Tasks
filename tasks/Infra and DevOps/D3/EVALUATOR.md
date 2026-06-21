# D3 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Stack profile

| Field | Value |
|-------|-------|
| Profile | GitHub Actions CI |
| Task root | `tasks/Infra and DevOps/D3` |
| Service | `service/` — FastAPI echo API |
| Workflow | `.github/workflows/ci.yml` |
| Image name | `d3-echo-api` |

## Expected workflow jobs

| Order | Job | Must fail on | Command |
|-------|-----|--------------|---------|
| 1 | `lint` | style/syntax errors | `ruff check app tests` |
| 2 | `test` | failing assertions | `pytest -v` (matrix) |
| 3 | `build-image` | Dockerfile errors | `docker build` with tags |

### Job DAG

```
push → lint → test (matrix) → build-image
```

- `test` has `needs: lint`
- `build-image` has `needs: test`
- Concurrency group cancels in-progress runs on same ref

### Cache contract

| Job | Cache | Key inputs |
|-----|-------|------------|
| `lint` | `~/.cache/pip` | OS + `requirements-dev.txt` hash |
| `test` | `~/.cache/pip` | OS + matrix Python version + hash |
| `build-image` | GHA BuildKit | `cache-from/to: type=gha` |

### Matrix contract

| Axis | Values |
|------|--------|
| `python-version` | `3.11`, `3.12` |

`fail-fast: false` — both legs report independently.

### Image tagging contract

Local / `run-ci-local.sh`:

- `d3-echo-api:sha-{short}`
- `d3-echo-api:{branch-slug}`

Workflow also prepares `ghcr.io/{owner}/d3-echo-api` metadata; build uses `push: false`.

## Verification commands

### Green run (must pass)

```bash
cd "tasks/Infra and DevOps/D3"
chmod +x scripts/*.sh
./scripts/run-ci-local.sh
# Expected exit 0
# Expected: lint: OK, test: OK, build-image: OK
# Expected final line: CI local run: PASSED (exit 0)
```

Requires Docker daemon for stage 3. Stages 1–2 pass without Docker.

### Failure mode demo (must fail at test)

```bash
./scripts/demo-failure.sh
# Expected exit 1
# Expected: lint: OK, test FAILED (AssertionError on /health)
# Expected final line: Failure demo: FAILED as expected (exit 1)
# File auto-reverted on exit
```

Deliberate break: `assert response.json() == {"status": "broken"}` in `test_health_returns_ok`.

### Optional act run

```bash
act push -W .github/workflows/ci.yml --container-architecture linux/amd64
```

## Pass criteria

- [ ] `.github/workflows/ci.yml` triggers on push (and PR if present)
- [ ] Three jobs: lint → test → build-image in dependency order
- [ ] Pip cache configured with lockfile/requirements hash
- [ ] Test matrix covers at least two Python versions
- [ ] Build stage tags image with sha and branch (or equivalent ref slug)
- [ ] `./scripts/run-ci-local.sh` exit 0 (all three stages when Docker available)
- [ ] `./scripts/demo-failure.sh` exit 1 with test failure (lint still green)
- [ ] README documents local run, act, and failure demo
- [ ] No secrets or registry push credentials committed

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| lint fails | ruff violations in `app/` or `tests/` |
| test matrix leg missing | Python 3.11 not installed locally — script warns and uses `python3` |
| build-image fails | Docker daemon not running |
| failure demo exits 0 | Break not applied or wrong assertion patched |
| act fails | Docker not running or workflow path wrong |
| wrong working-directory | Service lives under `tasks/Infra and DevOps/D3/service` |

## Service contract (sanity check)

Endpoints in `service/app/main.py`:

- `GET /health` → `{"status":"ok"}`
- `GET /echo/{message}` → `{"message":"<message>"}`

Tests: `service/tests/test_health.py` — 2 tests (health + echo).

## Downstream consumers

- **D4** builds `d4-echo-api:1.0.0` from `../D3/service`
- **D5** reuses the same echo API pattern for bootstrap demo
