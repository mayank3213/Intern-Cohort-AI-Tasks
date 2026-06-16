# D5 — Repo Bootstrap Demo

One-command bootstrap for the FastAPI echo service (reuses the D3 service pattern).

## Fresh clone → working tests

Prerequisites on the host: `git`, `make`, `curl` (for first-time mise install only).

```bash
git clone <repo-url>
cd "tasks/Infra and DevOps/D5"
make bootstrap
```

That single command:

1. Installs [mise](https://mise.jdx.dev) if missing
2. Installs Python **3.12** from `.mise.toml`
3. Creates `service/.venv` and installs `requirements-dev.txt`
4. Runs `pytest -v` (must pass)

## Other commands

| action | command |
|---|---|
| run tests only | `make test` |
| lint (ruff) | `make lint` |
| simulate fresh clone | `make clean && make bootstrap` |
| bootstrap without test | `./scripts/bootstrap.sh --no-test` |

## Bootstrap files

| file | role |
|---|---|
| `.mise.toml` | pins Python 3.12 |
| `Makefile` | `bootstrap`, `test`, `lint`, `clean` |
| `scripts/bootstrap.sh` | idempotent install + test gate |

## Optional (not in bootstrap)

- **Docker** — required only for container image builds (see D3 CI); not needed for unit tests
- **Env vars** — none required for tests

See `bootstrap-run-d5-demo.md` for full command output and the previously-implicit inventory.
