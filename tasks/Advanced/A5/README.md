# A5 — Agent-Generated PR Review (60 min)

Review an **agent-generated pull request** for correctness, security, test quality, performance, and maintainability. Produce a structured issue list with severity, blocking/non-blocking classification, suggested fixes, and verification steps.

**Do not implement fixes** unless explicitly asked — analysis only.

## Fixture

| Artifact | Path |
|----------|------|
| Base repo | [`../A4/starter/`](../A4/starter/) — A4 legacy baseline |
| Agent PR diff | [`fixture/agent-change.patch`](fixture/agent-change.patch) |
| PR description | [`fixture/PR_DESCRIPTION.md`](fixture/PR_DESCRIPTION.md) |

The patch simulates an agent follow-up to A4: platform pin + CI + SQLite + search endpoint — with **deliberate flaws**.

Do **not** read [`EVALUATOR.md`](EVALUATOR.md) during the exercise.

## Deliverables

Submit one markdown review with:

1. **Review metadata** — base, head, files touched, inferred PR purpose
2. **Issue list** — table: id, dimension, severity, blocking/non-blocking, title, location
3. **Issue details** — per blocking/major issue: evidence, suggested fix, verification step
4. **Verdict** — `APPROVE`, `APPROVE_WITH_NOTES`, or `REQUEST_CHANGES` with rationale
5. **Agent vs manual** — what you verified yourself vs assumed from diff

Minimum **5 issues**; target **8–10** across security, correctness, test, and maintainability.

## Review dimensions (all required)

| Dimension | Look for |
|-----------|----------|
| Correctness | Wrong status codes, broken API contract, logic errors |
| Security | Injection, secrets in repo, PII in logs |
| Test | Missing coverage for new behavior, broken CI |
| Performance | N+1, unbounded work (if present) |
| Maintainability | Scope creep, magic values, docs drift |

## Time box

| Phase | Minutes |
|-------|---------|
| Read PR description + scan diff | 15 |
| Deep review (5 dimensions) | 30 |
| Write issue list + verdict | 15 |

## Setup

### Review patch only (default)

```bash
cd tasks/Advanced/A5
cat fixture/PR_DESCRIPTION.md
less fixture/agent-change.patch
# or
./scripts/show-fixture.sh
```

Compare each hunk against [`../A4/starter/`](../A4/starter/) files.

### Optional: apply to sandbox (hands-on)

**Do not apply to canonical `A4/starter/`.**

```bash
chmod +x scripts/*.sh
./scripts/apply-fixture.sh
# sandbox: fixture/sandbox/
```

## Pass criteria

- [ ] Issues cite `source: path:line` from the **patch** or base+head context
- [ ] At least one **blocking** security finding (injection or secret)
- [ ] At least one **blocking** test/CI finding (missing tests or broken workflow)
- [ ] At least one **correctness** finding (HTTP status / validation regression)
- [ ] Each blocking issue has suggested fix + verification step
- [ ] Verdict matches blocking count (`REQUEST_CHANGES` if any blocking security/correctness)

## Layout

```
A5/
├── README.md
├── EVALUATOR.md
├── fixture/
│   ├── PR_DESCRIPTION.md
│   ├── agent-change.patch
│   ├── post/                  # reference head state (graders)
│   └── sandbox/               # created by apply-fixture.sh (gitignored)
├── scripts/
│   ├── show-fixture.sh
│   └── apply-fixture.sh
├── agent-pr-reviewer.md
└── agent-run-output-reslim.md   # golden sample (reSlim variant)
```

## Agent workflow

For AI-assisted runs, see [`agent-pr-reviewer.md`](agent-pr-reviewer.md).

Golden sample (reSlim): [`agent-run-output-reslim.md`](agent-run-output-reslim.md).

## Evaluator

Graders: [`EVALUATOR.md`](EVALUATOR.md).
