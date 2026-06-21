# D3 — CI Pipeline (45 min)

GitHub Actions workflow for the **D3 Echo FastAPI service**: **lint → test (matrix) → build and tag container image** on every push. Prove a green local run and a deliberate failure that stops at the test stage.

## Architecture

```
push / pull_request
       │
       ▼
    lint (ruff)
       │
       ▼
    test (Python 3.11 + 3.12 matrix)
       │
       ▼
    build-image (docker build, sha + branch tags)
```

## Pass criteria

- [ ] `.github/workflows/ci.yml` defines lint, test, and build-image jobs on push
- [ ] Pip cache configured per job; test job uses a Python version matrix
- [ ] Image build tags at least `sha-{short}` and `{branch}` locally
- [ ] `./scripts/run-ci-local.sh` exits **0** (lint + test + docker build)
- [ ] `./scripts/demo-failure.sh` exits **1** with a failing test (auto-reverts)
- [ ] README documents local run, act, and failure demo

## Prerequisites

| Tool | Version | Required for |
|------|---------|--------------|
| Python 3 | 3.11+ | lint, test stages locally |
| [Docker](https://docs.docker.com/get-docker/) | 24+ | build-image stage |
| `git` | any | SHA/branch tags in local CI script |
| [act](https://github.com/nektos/act) | optional | run workflow YAML locally |

## Layout

```
D3/
├── README.md
├── EVALUATOR.md
├── .github/workflows/ci.yml
├── service/
│   ├── Dockerfile
│   ├── app/main.py           # GET /health, GET /echo/{message}
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pyproject.toml
│   └── tests/test_health.py
└── scripts/
    ├── run-ci-local.sh       # mirrors workflow stages
    └── demo-failure.sh       # deliberate test regression
```

## Quick start (local CI)

From this directory:

```bash
chmod +x scripts/*.sh
./scripts/run-ci-local.sh
```

Expected final line:

```text
CI local run: PASSED (exit 0)
```

Stages:

1. **lint** — `ruff check app tests`
2. **test** — `pytest -v` for Python 3.11 and 3.12 (falls back to `python3` if a version is missing)
3. **build-image** — `docker build` with tags `d3-echo-api:sha-{short}` and `d3-echo-api:{branch}`

## Commands

| action | command |
|--------|---------|
| full local CI | `./scripts/run-ci-local.sh` |
| failure demo | `./scripts/demo-failure.sh` |
| lint only | `cd service && ruff check app tests` |
| test only | `cd service && pytest -v` |
| build image only | `docker build -t d3-echo-api:local service/` |
| run with act | `act push -W .github/workflows/ci.yml --container-architecture linux/amd64` |

## Failure mode demo

Breaks `test_health_returns_ok` temporarily, runs CI, expects exit **1**, then restores the file:

```bash
./scripts/demo-failure.sh
```

Expected: lint passes, test fails with `AssertionError`, script prints `Failure demo: FAILED as expected (exit 1)`.

## Workflow details

| Job | Trigger | Cache | Notes |
|-----|---------|-------|-------|
| `lint` | push, PR | pip (`requirements-dev.txt` hash) | Python 3.12 |
| `test` | after lint | pip per matrix axis | matrix: `3.11`, `3.12`; `fail-fast: false` |
| `build-image` | after test | GHA BuildKit (`type=gha`) | `push: false`, tags sha + branch |

Image name: `d3-echo-api`. On GitHub Actions the workflow also prepares `ghcr.io/{owner}/d3-echo-api` metadata (build only; no push without registry secrets).

## Environment

| variable | default | used by |
|----------|---------|---------|
| `IMAGE_NAME` | `d3-echo-api` | `run-ci-local.sh` |
| `PYTHON_VERSIONS` | `3.11 3.12` | local test matrix |
| `SERVICE_DIR` | `tasks/Infra and DevOps/D3/service` | workflow env |

## Downstream reuse

The D3 service image and Dockerfile are reused by:

- **D4** — kind cluster deploy (`d4-echo-api:1.0.0`)
- **D5** — same echo API pattern for bootstrap demo

## Agent workflow

For AI-assisted runs, see [`ci-pipeline-writer.md`](ci-pipeline-writer.md).

Captured run output: [`ci-run-d3-demo.md`](ci-run-d3-demo.md).

## Evaluator

Graders: see [`EVALUATOR.md`](EVALUATOR.md) *(do not share with candidates during eval)*.
