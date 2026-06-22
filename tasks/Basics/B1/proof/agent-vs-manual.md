# Agent vs Manual Verification — B4 Transaction Ledger

Comparison of counts from `agent-run-output-b4-ledger.md` (agent) against manual shell commands run from repository root.

## File-level counts

Commands used:

```bash
find tasks/Basics/B4 -name "*.py" -not -path "*/.venv/*" | wc -l
find tasks/Basics/B4/tests -name "*.py" -not -path "*/.venv/*" | wc -l
find tasks/Basics/B4 -name "*.md" -not -path "*/.venv/*" | wc -l
find tasks/Basics/B4 -name "*.json" -not -path "*/.venv/*" | wc -l
rg -c '^def test_' tasks/Basics/B4/tests -g '*.py'
```

| Artifact Type | Agent Count | Manual Count | Match |
| --- | ---: | ---: | --- |
| Python files | 6 | 6 | Yes |
| Test Python files (`tests/`) | 2 | 2 | Yes |
| Test functions (`def test_`) | 5 | 5 | Yes |
| Markdown files | 2 | 2 | Yes |
| JSON files | 0 | 0 | Yes |

**Notes:** Markdown count includes `tasks/Basics/B4/.pytest_cache/README.md` (pytest cache artifact) and `tasks/Basics/B4/README.md`. Both agent scan (`proof/run-inventory-b4.txt`) and manual `find` use the same exclusion (`.venv` only).

## Artifact category counts

Commands used:

```bash
rg -c '^class ' tasks/Basics/B4/app -g '*.py'
rg '^def (create_|list_|get_)' tasks/Basics/B4/app/main.py | wc -l
```

| Category | Agent Count | Manual Count | Match |
| --- | ---: | ---: | --- |
| controller (route handlers) | 3 | 3 | Yes |
| service (`TransactionStore`) | 1 | 1 | Yes |
| model (Pydantic / enum) | 4 | 4 | Yes |
| config (FastAPI bootstrap) | 1 | 1 | Yes |
| repository | 0 | 0 | Yes |
| job | 0 | 0 | Yes |
| consumer | 0 | 0 | Yes |
| utility | 0 | 0 | Yes |
| interface | 0 | 0 | Yes |
| class (fallback) | 0 | 0 | Yes |
| **Total artifacts** | **9** | **9** | **Yes** |

**Notes:** Manual service count uses `rg '^class ' tasks/Basics/B4/app/store.py` (one class). Manual model count uses four `BaseModel`/`Enum` classes in `app/schemas.py`. Controller count matches three `def create_|list_|get_` handlers in `app/main.py`.

## Scan evidence

Terminal output captured in [`run-inventory-b4.txt`](run-inventory-b4.txt) was produced by running the `code-artifact-mapper` workflow (see `tasks/Basics/B1/code-artifact-mapper.md`) against `tasks/Basics/B4` with `.venv` excluded. Agent report: [`agent-run-output-b4-ledger.md`](../agent-run-output-b4-ledger.md).
