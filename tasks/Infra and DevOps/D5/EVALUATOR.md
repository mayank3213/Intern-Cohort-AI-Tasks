# D5 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Stack profile

| Field | Value |
|-------|-------|
| Profile | Makefile + mise bootstrap |
| Task root | `tasks/Infra and DevOps/D5` |
| Service | `service/` — FastAPI echo API (D3 pattern) |
| Single command | `make bootstrap` |
| Python pin | 3.12 (`.mise.toml`) |

## Expected bootstrap files

| File | Role |
|------|------|
| `.mise.toml` | Pins Python 3.12 |
| `Makefile` | Targets: `bootstrap`, `test`, `lint`, `clean` |
| `scripts/bootstrap.sh` | Idempotent: mise → venv → deps → optional pytest |
| `service/requirements-dev.txt` | Runtime + test + lint deps |
| `service/pyproject.toml` | pytest config |

### Bootstrap flow

1. Ensure `mise` installed (curl install script or Homebrew fallback)
2. `mise install` — Python 3.12
3. Create `service/.venv` if missing
4. `pip install -r requirements-dev.txt`
5. Run `pytest -v` (unless `--no-test`)

## Verification commands

### Fresh-clone simulation (must pass)

```bash
cd "tasks/Infra and DevOps/D5"
make clean
make bootstrap
# Expected exit 0
# Expected final line: Bootstrap complete: tools installed, deps installed, tests passed (exit 0)
# Expected pytest: 2 passed
```

### Test-only (after bootstrap)

```bash
make test
# Expected exit 0, 2 passed
```

### Lint

```bash
make lint
# Expected exit 0, ruff clean
```

## Test contract

File: `service/tests/test_health.py`

| Test | Proves |
|------|--------|
| `test_health_returns_ok` | `GET /health` → `{"status":"ok"}` |
| `test_echo_returns_message` | `GET /echo/hello` → `{"message":"hello"}` |

## Previously implicit (must be documented)

Candidates should document what bootstrap replaces:

| Item | How pinned / installed |
|------|------------------------|
| Python version | mise `.mise.toml` → 3.12 |
| pip packages | `requirements-dev.txt` into `service/.venv` |
| pytest, ruff, httpx, fastapi | via requirements-dev |
| mise itself | auto-installed by `bootstrap.sh` if missing |
| Env vars | none required for tests |
| Docker | not required for bootstrap/tests (CI/image is D3) |

## Pass criteria

- [ ] Single command (`make bootstrap`) installs tools + deps and runs tests
- [ ] Python version pinned (mise, asdf, Nix, or devcontainer equivalent)
- [ ] Bootstrap is idempotent (second run succeeds without error)
- [ ] `make test` passes (2/2) after bootstrap
- [ ] `make clean && make bootstrap` simulates fresh clone successfully
- [ ] README lists bootstrap files and documents implicit prerequisites
- [ ] No committed secrets; `.venv` should be gitignored (not committed)

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| mise install fails | No network or curl blocked |
| wrong Python version | mise not activated; system Python used |
| pytest not found | bootstrap skipped or venv path wrong |
| tests fail on clean machine | Missing dep in `requirements-dev.txt` |
| bootstrap slow on repeat | Expected — pip may re-check; should still exit 0 |
| committed `.venv` in repo | Anti-pattern — grader should run `make clean` first |

## Optional checks

```bash
./scripts/bootstrap.sh --no-test   # install only, no pytest gate
make lint                          # ruff check app tests
mise which python                  # should resolve to 3.12.x
```

## Relationship to other tasks

- Service mirrors **D3** echo API (`/health`, `/echo/{message}`)
- **D6** extends the same service with structlog + Prometheus metrics
- **D3 CI** builds container image; Docker not part of D5 bootstrap
