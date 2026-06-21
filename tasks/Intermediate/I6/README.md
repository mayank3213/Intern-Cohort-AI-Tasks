# I6 — Bug Diagnosis (60 min)

## Goal

Diagnose a **seeded bug** in an unfamiliar repo: reproduce it, find root cause with file paths, apply a minimal fix, and verify with exact commands. Document what you verified manually vs what the agent suggested.

## Target

**Sandbox:** `tasks/Intermediate/I6/fixture/sandbox/` — disposable copy of the B5 ledger with a **seeded bug** applied.

**Do not modify** canonical `tasks/Basics/B5` (that copy must stay green for B5 eval).

## Symptom (do not read EVALUATOR.md)

After seeding balance with a credit, a **debit equal to the full balance** should succeed (balance → 0). The API incorrectly returns **400 Bad Request**.

## Deliverables

1. **Reproduction steps** — commands from clean state to observed failure
2. **Root cause** — mechanism + `source: path:line-range` citations
3. **Minimal fix** — smallest change; files changed table
4. **Verification command and result** — must show failing test passing after fix
5. **Agent suggested vs manually verified** table

## Setup

Prepare the sandbox (copies B5 and applies the seeded bug):

```bash
cd tasks/Intermediate/I6
chmod +x scripts/prepare-sandbox.sh
./scripts/prepare-sandbox.sh
cd fixture/sandbox
npm install
npm test
```

One test should **fail** before your fix:

```bash
npm test -- --run -t "allows debit equal to full balance"
```

## Verification (after fix)

From `fixture/sandbox/`:

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

## Layout

```
I6/
├── README.md
├── EVALUATOR.md
├── fixture/
│   ├── seed-bug.patch          # introduces <= bug into B5 copy
│   └── sandbox/                # created by prepare-sandbox.sh (gitignored)
├── scripts/
│   └── prepare-sandbox.sh      # copy B5 + apply patch — does not touch canonical B5
└── seeded-bug-diagnoser.md
```

## Alternate anchor (PHP)

If PHP 8+ and MySQL are available, you may instead diagnose the JSON falsy bug in `reSlim/src/classes/JSON.php` (`modifyJsonStringInArray`). See agent spec for reproduction one-liner.
