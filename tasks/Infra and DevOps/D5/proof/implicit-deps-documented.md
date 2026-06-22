# D5 — Implicit Dependencies (Documented)

Evidence captured: `proof/bootstrap-full-output.txt`, `proof/tests-passing.txt`  
Run date (UTC): 2026-06-22

This inventory records assumptions that were previously tribal knowledge and are now encoded in bootstrap config, scripts, or README. Findings below come from the actual bootstrap/test run on this host and from reading the repo files — not invented.

---

## Summary table

| Area | Previously implicit | Now documented / encoded | Verified in proof run |
| --- | --- | --- | --- |
| Python version | “3.11+” or “use system Python” | `.mise.toml` → `python = "3.12"` | Python 3.12.13 via mise |
| Python install | Manual pyenv / brew / apt | `scripts/bootstrap.sh` → `mise install` | mise already present; `mise install` ran without error |
| Virtualenv location | Unclear which venv to use | `service/.venv` created by bootstrap; Makefile uses `$(abspath service/.venv)` | venv recreated after `make clean` |
| pip install step | Run `pip install -r …` by hand | `scripts/bootstrap.sh` installs `requirements-dev.txt` | deps installed silently (`-q` pip) |
| Test runner / command | “run pytest somehow” | `make test` → `pytest -v`; bootstrap runs tests as gate | 2 passed in bootstrap + separate `make test` |
| pytest import path (`app`) | Tribal knowledge | `service/pyproject.toml` → `pythonpath = ["."]` | tests collected and passed |
| Lint tool version | Assumed latest ruff | `requirements-dev.txt` → `ruff==0.9.2` | not exercised in proof files (see `make lint`) |
| Host tools | Unstated | README + `bootstrap.sh`: `git`, `make`, `curl` | `make` invoked successfully |
| mise on PATH | Assumed installed | `bootstrap.sh` searches `~/.local/bin`, Homebrew paths; auto-installs if missing | mise found at `~/.local/share/mise/installs/…` |
| Network access | Assumed for pip | Required for `pip install` and first-time mise/Python download | pip + mise install succeeded |
| Docker | Sometimes assumed for “local dev” | README: optional; not part of bootstrap | not used in proof run |
| Environment variables | Unknown if `.env` needed | README: none required for unit tests | tests passed with no `.env` |
| Paths with spaces | Fragile shell quoting | Makefile `$(abspath …)` for venv binary paths | repo path contains spaces; bootstrap + test exit 0 |

---

## Host prerequisites (still required, now explicit)

These are **not** installed by bootstrap and must exist on the machine before `make bootstrap`:

| Tool | Why | Source |
| --- | --- | --- |
| `make` | Entry point (`make bootstrap`, `make test`) | `Makefile`, `README.md` |
| `curl` | First-time mise install via `https://mise.jdx.dev/install.sh` | `scripts/bootstrap.sh` |
| `git` | Clone workflow (not invoked by bootstrap itself) | `README.md` |
| Network | pip packages + mise/Python plugins on first run | observed during proof run |

Optional fallback documented in `bootstrap.sh`: if curl install fails and `brew` is available, `brew install mise` is attempted.

---

## Tools automated by bootstrap

| Tool | Mechanism | Proof observation |
| --- | --- | --- |
| mise | `ensure_mise` in `scripts/bootstrap.sh` | Already installed; `mise install` from `.mise.toml` succeeded |
| Python 3.12 | `.mise.toml` + `mise install` | `/Users/mayanksrivastava/.local/share/mise/installs/python/3.12/bin/python` |
| pytest, httpx, ruff | `pip install -r service/requirements-dev.txt` | pytest 8.3.4, anyio 4.14.0 plugin in test output |
| FastAPI stack | `pip install -r service/requirements.txt` (via `-r` in dev file) | health/echo tests import `app.main` successfully |

---

## Dual venv note (honest hidden detail)

`.mise.toml` declares a root-level venv at `D5/.venv` (`_.python.venv`), while `scripts/bootstrap.sh` creates and uses **`service/.venv`** for pip and pytest. The Makefile and proof run use **`service/.venv` only**. The root `.mise.toml` venv is mise-managed; bootstrap does not rely on it for tests. This split was implicit before bootstrap existed.

---

## Still optional / out of scope

| Item | Status |
| --- | --- |
| Docker daemon | Not required for `make bootstrap` or `make test` |
| `.env` / secrets | Not required for current unit tests |
| `uvicorn` runtime | Installed as dependency but not started during bootstrap/test proof |
| CI matrix (3.11 vs 3.12) | Local pin is 3.12 only; aligns with `.mise.toml` |

---

## Commands used to produce proof

```bash
cd "tasks/Infra and DevOps/D5"
make clean          # simulate fresh clone (removes service/.venv)
make bootstrap      # → proof/bootstrap-full-output.txt (exit 0)
make test           # → proof/tests-passing.txt (exit 0)
```

See `bootstrap-run-d5-demo.md` for the narrative demo report; these proof files are reproducible terminal captures separate from that document.
