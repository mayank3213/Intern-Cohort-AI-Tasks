# Agent vs Manual Verification — A1 Parallel Plan

Manual inspection of [`parallel-plan-a1-demo.md`](../parallel-plan-a1-demo.md) for file-overlap risks, merge safety, and lane ownership. The plan was not redesigned; this document records proof only.

**Target repo:** `$REPO_ROOT/extras/cloned-repos/reSlim`  
**Task ID:** A1-DEMO  
**Lanes:** 2 (`L-readme`, `L-config`)

## Lane ownership summary

| Lane | Branch | Write (owns_write) | Read-only |
| --- | --- | --- | --- |
| L-readme | `parallel/A1-DEMO/readme` | `readme.md` | `src/composer.json`, `license.md`, `.github/workflows/php-syntax.yml` |
| L-config | `parallel/A1-DEMO/config` | `src/config.php` | `readme.md`, `src/composer.json`, `src/app/dependencies.php` |

## File-overlap review

| Area | Agent Plan | Manual Review |
| --- | --- | --- |
| Documentation (README) | L-readme exclusive writer | No overlap — single writer for `readme.md` |
| Runtime config | L-config exclusive writer | No overlap — single writer for `src/config.php` |
| Composer manifest | Read-only for L-readme | Safe — plan forbids editing `src/composer.json` |
| Cross-lane reads | L-config may read `readme.md`; L-readme may read `composer.json` | Safe if read-only honored; **risk if agent edits read-only files** |
| Application code | Out of scope for both lanes | No overlap — `src/app/`, routers, classes forbidden |
| CI / workflows | Read-only reference only | No write overlap; integration PR may trigger `php-syntax.yml` |
| Tests | No dedicated test lane | No test file writes planned; **uncertainty:** no new tests added for config hardening |
| Worktrees / git ops | A2 executor only | No overlap between lane agents during planning phase |

## Conflict risks

| Risk ID | Type | Manual assessment |
| --- | --- | --- |
| R-05 merge_conflict | Shared write paths | **Very low** — G1 pass verified manually: `readme.md` and `src/config.php` are disjoint |
| R-01 contract_drift | README PHP wording vs `composer.json` | **Low–med** — semantic coupling; mitigated if L-readme reads Composer constraint before editing README |
| R-02 / R-03 scope_creep | Lane expands beyond AC | **Med** — agents could touch forbidden sections; stop conditions documented |
| Read-only violation | Lane writes file owned by other lane | **Med if violated** — would invalidate parallel safety; executor should abort merge per plan playbook |
| Integration merge order | L-readme before L-config | **No file conflict** — order is convention only; either order safe for disjoint files |

## Files touched by each lane

**L-readme (write):**

- `readme.md` — WU-01 (PHP requirement alignment), WU-03 (install path accuracy)

**L-config (write):**

- `src/config.php` — WU-02 (credential/secret hardening), WU-04 (syntax verification)

**Neither lane writes (explicitly forbidden or read-only):**

- `src/composer.json`, `src/app/**`, `src/classes/**`, `src/routers/**`, `src/modules/**`, `src/vendor/**`

## Merge concerns

1. **Expected conflict-free merges** — Plan states both lane merges into `parallel/A1-DEMO/integration` should apply cleanly because write sets do not intersect.
2. **Accidental dual-writer scenario** — If one branch modifies both `readme.md` and `src/config.php`, the plan instructs abort and re-run affected lane. Manual review agrees this is the correct escalation.
3. **Semantic consistency post-merge** — After both merges, README PHP floor should match `composer.json` (`^7.4 || ^8.0`). Not a git conflict; requires integration verification (grep checks in plan).
4. **Preflight note** — Plan records HEAD was on integration branch at plan time while lanes fork from `master`; executor must fork lanes from documented base SHA. **Uncertainty:** local dirty/untracked `.worktrees/` state may affect executor preflight but does not change overlap analysis.

## Recommended merge order

Matches plan `# Merge Order` (manual review concurs):

1. **L-readme → `parallel/A1-DEMO/integration`** — documentation-only; establishes AC-1 early.
2. **L-config → `parallel/A1-DEMO/integration`** — disjoint file; safe second merge.

Alternative order (L-config first, then L-readme) is also safe for git conflicts; plan prefers docs-first for integration verification workflow.

## Post-merge verification (from plan)

| Stage | Command focus | Manual note |
| --- | --- | --- |
| Lane-local L-readme | `grep` PHP wording in `readme.md` | Requires repo checkout in lane worktree |
| Lane-local L-config | `php -l src/config.php` | Requires local PHP binary (R-04) |
| Integration | `find src -name '*.php' \| php -l`, AC spot checks | `[NEEDS VERIFICATION]` for `composer validate` if Composer not installed locally |

## Uncertainties (not hidden)

- **Rollback:** Plan file has no inline rollback steps; deferred to A2 executor spec.
- **`composer validate`:** Marked `[NEEDS VERIFICATION]` in plan — may fail or be skipped if Composer unavailable locally.
- **No automated test lane:** Config hardening relies on `php -l` and grep, not PHPUnit — acceptable for scope but limits regression detection.
- **Submodule path:** reSlim lives at `extras/cloned-repos/reSlim`; executor must init submodule before worktree creation (`git submodule update --init extras/cloned-repos/reSlim`).

## Proof artifacts

| Artifact | Description |
| --- | --- |
| [`plan-checklist-verified.txt`](plan-checklist-verified.txt) | Manual checklist of required plan sections |
| [`../parallel-plan-a1-demo.md`](../parallel-plan-a1-demo.md) | Golden parallel plan (portable paths applied) |
| [`../parallel-task-splitter.md`](../parallel-task-splitter.md) | A1 agent workflow spec |
