# I6 — Bug Diagnosis (60 min)

## Goal

Diagnose a **seeded bug** in an unfamiliar repo: reproduce it, find root cause with file paths, apply a minimal fix, and verify with exact commands. Document what you verified manually vs what the agent suggested.

## Target

**Repo:** `tasks/Basics/B5` (Node.js Express transaction ledger)

## Symptom (do not read EVALUATOR.md)

After seeding balance with a credit, a **debit equal to the full balance** should succeed (balance → 0). The API incorrectly returns **400 Bad Request**.

## Deliverables

1. **Reproduction steps** — commands from clean state to observed failure
2. **Root cause** — mechanism + `source: path:line-range` citations
3. **Minimal fix** — smallest change; files changed table
4. **Verification command and result** — must show failing test passing after fix
5. **Agent suggested vs manually verified** table

## Setup

```bash
cd tasks/Basics/B5
npm install
npm test
```

One test should **fail** before your fix:

```bash
npm test -- --run -t "allows debit equal to full balance"
```

## Verification (after fix)

```bash
npm test
```

All tests must pass.

## Rules

- ≤2 production files, ≤1 test file, ≤40 lines changed
- No refactors or dependency upgrades
- Cite exact comparison/branch that causes the bug

## Reference

- Agent workflow: [`seeded-bug-diagnoser.md`](seeded-bug-diagnoser.md)
- Evaluator answer key: [`EVALUATOR.md`](EVALUATOR.md) *(hidden from candidates during eval)*

## Alternate anchor (PHP)

If PHP 8+ and MySQL are available, you may instead diagnose the JSON falsy bug in `reSlim/src/classes/JSON.php` (`modifyJsonStringInArray`). See agent spec for reproduction one-liner.
