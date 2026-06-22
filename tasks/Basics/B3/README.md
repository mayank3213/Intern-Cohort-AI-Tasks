# B3 — Test Discovery & Execution (15 min)

## Goal

For a module or repository, identify the **test framework**, find **relevant test files**, determine the **exact command** to run tests, **execute it**, and report the result with failure interpretation if any.

## Setup

```bash
# from repo root — optional for reSlim target
git submodule update --init extras/cloned-repos/reSlim
```

**Suggested targets:**

| Target | Framework | Typical command |
|--------|-----------|-----------------|
| `tasks/Basics/B4` | pytest | `pytest -q` |
| `tasks/Basics/B5` | Vitest | `npm test` |
| `tasks/Basics/B6` | cargo test | `cargo test` |
| `extras/cloned-repos/reSlim/` | PHPUnit | `vendor/bin/phpunit` (after `composer install`) |

Pick one target and scope to a single module when the repo is large.

## Deliverables

Submit a single markdown report with these sections **in this exact order**:

1. **Test framework and config file** — framework name(s), config path(s), detection evidence
2. **Relevant test files** — ranked high / medium / low relevance with paths
3. **Exact commands** — primary command + fallbacks considered, with reason for primary
4. **Actual command result** — command string, exit code, key output lines (verbatim)
5. **Any failure and interpretation** — status (`pass`/`fail`), failure type, evidence, likely cause, next step

If a section has no findings, write `None found` and explain how it was checked.

## Rules

- Do not assume `npm test` — verify from manifests and config files first
- Execute the primary command; do not stop at framework detection
- Never fabricate output — paste observed results only
- Classify failures: assertion, runtime, compile, dependency, config, or environment

## Hints

- B4: look for `requirements.txt`, `tests/test_api.py`, run from `tasks/Basics/B4`
- B5: look for `package.json` scripts, `tests/api.test.js`
- B6: look for `Cargo.toml`, `#[cfg(test)]` in `src/lib.rs`
- reSlim: `composer.json` + `phpunit.xml` under project root

## Pass criteria

- [ ] Framework and config identified with evidence
- [ ] At least one relevant test file listed per relevance tier (or "none" explained)
- [ ] Primary command executed (not just suggested)
- [ ] Actual exit code and output captured
- [ ] Failures interpreted with classification and next step
- [ ] Completed within 15 minutes

## Reference

- Agent workflow: [`test-discovery-executor.md`](test-discovery-executor.md)
- Golden sample: [`agent-run-output-reslim.md`](agent-run-output-reslim.md)
