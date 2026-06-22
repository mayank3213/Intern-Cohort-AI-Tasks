# Agent vs Manual Verification

Compares claims in [`parallel-run-a1-demo.md`](../parallel-run-a1-demo.md) against proof captured under `proof/` from manual re-execution on 2026-06-23.

## Summary

| Area | Agent Output | Manual Verification | Result |
| --- | --- | --- | --- |
| Parallel split (L-readme + L-config) | Disjoint file lanes | Reviewed against [`parallel-plan-a1-demo.md`](../../A1/parallel-plan-a1-demo.md) | Confirmed |
| Worktree bootstrap | `git worktree add -B` commands | Executed — [`worktree-create-commands.txt`](worktree-create-commands.txt) | Confirmed |
| Lane Alpha (README) | PHP 7.4+ alignment | Commit on `parallel/A1-DEMO/readme` — [`lane-alpha-output.txt`](lane-alpha-output.txt) | Confirmed |
| Lane Beta (config) | Secret hardening | Commit on `parallel/A1-DEMO/config` — [`lane-beta-output.txt`](lane-beta-output.txt) | Confirmed |
| Merge order | readme → config, zero conflicts | [`merge-log.txt`](merge-log.txt) | Confirmed |
| AC-1–AC-5 integration checks | grep + `php -l` spot checks | [`verification-tests-green.txt`](verification-tests-green.txt) | Confirmed |
| `composer validate` | Deferred (missing composer) | Runs but fails on pre-existing package name format | Partial — finding holds, not lane-introduced |
| Full PHP sweep | Deferred | `LazyPDO.php` fails on PHP 8.5 on master — pre-existing | Not lane regression |

---

## Findings

| Finding | Agent Detected | Manually Reproduced | Status |
| --- | --- | --- | --- |
| Worktrees created at documented paths | Yes | Yes — bootstrap log captured | Confirmed |
| Lane commits on separate branches | Yes | Yes — alpha `2b0a0b9`, beta `25380b7` | Confirmed |
| Merge order readme then config | Yes | Yes — both merges exit 0 | Confirmed |
| Zero merge conflicts | Yes | Yes | Confirmed |
| AC-1 README mentions 7.4 | Yes | Yes — grep exit 0 | Confirmed |
| AC-2 no PHP5 wording in README | Yes | Yes — grep exit 0 | Confirmed |
| AC-3 `php -l src/config.php` clean | Yes | Yes — exit 0 on PHP 8.5.7 | Confirmed |
| AC-4 placeholder credentials removed | Yes | Yes — grep no matches | Confirmed |
| AC-5 integration branch state | Yes | Yes — spot checks on integration | Confirmed |
| Repo path / base SHA / commit SHAs | Documented in agent report | Different paths/SHAs on re-run (same changes) | Confirmed with notes |
| `composer.json` explicit `php` key | Plan assumed constraint present | Current master lacks key — grep exit 1 | Not reproduced as stated in plan |
| `composer validate` green | Marked partial in agent report | Fails on pre-existing name format | Confirmed pre-existing failure |

---

## Commands Used

```bash
REPO="extras/cloned-repos/reSlim"

# Worktrees (full log in proof/worktree-create-commands.txt)
cd "$REPO"
git checkout -B parallel/A1-DEMO/integration "$(git rev-parse master)"
git worktree add -B parallel/A1-DEMO/readme .worktrees/A1-DEMO-readme "$(git rev-parse master)"
git worktree add -B parallel/A1-DEMO/config .worktrees/A1-DEMO-config "$(git rev-parse master)"

# Lane commits + merges — see proof/lane-alpha-output.txt, lane-beta-output.txt, merge-log.txt

# Verification on integration branch
cd "$REPO" && git checkout parallel/A1-DEMO/integration
grep -i "7.4" readme.md
php -l src/config.php
grep -E "(youremail@gmail.com|b372e7fe)" src/config.php || true
```

---

## Differences Between Agent and Manual Review

**Agent detected correctly**

- Parallel lane split, worktree workflow, merge order, and conflict-free integration match manual re-execution.
- AC-1 through AC-5 spot checks pass on the integration branch.
- `php -l src/config.php` succeeds where the original agent run deferred due to missing PHP.

**Required manual confirmation**

- Entire worktree → lane commit → merge → verify pipeline was re-run and logged with new commit SHAs.
- Submodule path `extras/cloned-repos/reSlim` differs from some agent report paths.

**Could not reproduce / differs from plan**

- Base SHA and commit SHAs differ because shallow clone HEAD (`9a78473`) differs from plan base (`a3c568be`); lane *changes* match intent.
- Plan assumed `composer.json` contains `"php": "^7.4 || ^8.0"` — current master has no explicit `php` key.
- `composer validate` and full-repo `php -l` sweep surface pre-existing issues unrelated to lane edits.

**Remaining uncertainty**

- No new automated tests were added for config hardening; verification relies on grep and syntax lint only.
- Long-term semantic alignment between README PHP wording and `composer.json` depends on a future composer constraint change not in lane scope.

---

## Final Confidence

**High confidence** — Parallel execution, merges, and integration AC checks were manually reproduced with captured logs. Medium caveats on SHA/path drift and pre-existing composer/PHP sweep issues are documented and do not invalidate lane-specific outcomes.

---

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [`worktree-create-commands.txt`](worktree-create-commands.txt) | Exact worktree bootstrap commands and stdout |
| [`lane-alpha-output.txt`](lane-alpha-output.txt) | L-readme branch log, status, diff |
| [`lane-beta-output.txt`](lane-beta-output.txt) | L-config branch log, status, diff |
| [`merge-log.txt`](merge-log.txt) | Merge order, commands, zero conflicts |
| [`verification-tests-green.txt`](verification-tests-green.txt) | AC-1–AC-5 verification with exit codes |
