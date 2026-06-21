# I3 — Small Safe Change in Unfamiliar Repo (60 min)

## Goal

Make **one** small, focused change in an unfamiliar module. Keep the diff minimal. Add or update **one** relevant test. Document why each file changed and assess risk.

## Choose one scenario

### Scenario A — B4 (Python / FastAPI) — *reference completed*

**Repo:** `tasks/Basics/B4`  
**Change:** Improve insufficient-funds error detail and add API test for overdraw.  
**Status:** Already applied — use as sample only. See [`agent-run-output-b4-ledger.md`](agent-run-output-b4-ledger.md).

### Scenario B — B4 pagination cap *(active)*

**Repo:** `tasks/Basics/B4`  
**Change:** Cap `GET /transactions` at **100** items. When truncated, include header `X-Truncated: true`. Add one test proving the cap.  
**Anchor:** `GET /transactions` in `app/main.py`  
**Budget:** ≤2 production files, ≤1 test file, ≤40 lines total.

### Scenario C — B5 (Node / Express) *(active)*

**Repo:** `tasks/Basics/B5`  
**Change:** Reject transaction descriptions that are only whitespace (after trim). Return **422** with clear message. Add one test.  
**Anchor:** `TransactionStore.add` in `src/store.js`  
**Note:** Store already trims — verify current behavior first; if already correct, implement Scenario B on B5 list endpoint instead.

## Deliverables

1. Unified diff or branch name
2. **Files changed** table — file, action, lines ±, **why this file**
3. **Test command** and verbatim result
4. **Risk assessment** — regression, API contract, data migration
5. **Agent suggested vs manually verified** table

## Setup

```bash
# B4
cd tasks/Basics/B4
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -q

# B5
cd tasks/Basics/B5
npm install
npm test
```

## Rules

- No refactors, dependency upgrades, or drive-by formatting
- Match existing test style (`pytest` for B4, `vitest` for B5)
- Stop and report `scope_overflow` if change exceeds budget

## Reference

- Agent workflow: [`surgical-patcher.md`](surgical-patcher.md)
