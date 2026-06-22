# Rollback strategy

Reverts the A4 first-step modernization applied to `tasks/Advanced/A4/starter/`. Config/tooling only — no application logic was changed.

## Files changed

| File | Change |
| --- | --- |
| `tasks/Advanced/A4/starter/composer.json` | Added `"php": "^8.1"` to `require` |
| `tasks/Advanced/A4/starter/.gitignore` | Expanded from IDE-only (`.vscode/`) to ignore `vendor/`, `composer.lock`, `logs/`, `.env`, OS cruft |
| `tasks/Advanced/A4/starter/.github/workflows/php-syntax.yml` | New GitHub Actions PHP syntax-check workflow |

See `proof/first-step-diff.patch` for the exact unified diff.

## Revert method

### Option A — restore individual files (uncommitted changes)

```bash
cd tasks/Advanced/A4/starter
git restore -- composer.json .gitignore
rm -rf .github/
```

### Option B — reverse-apply captured patch

From `tasks/Advanced/A4`:

```bash
git apply -R proof/first-step-diff.patch
```

If paths in the patch do not match your working tree layout, apply from the repo root with `--directory`:

```bash
cd /Users/mayanksrivastava/Desktop/agent
git apply -R --directory=tasks/Advanced/A4 proof/first-step-diff.patch
```

### Option C — revert a committed modernization commit

```bash
cd tasks/Advanced/A4/starter
git revert <commit-sha>
```

## Verification after rollback

After rollback, the first-step checks should fail and baseline syntax should still pass (PHP sources unchanged):

```bash
cd tasks/Advanced/A4
./scripts/verify-baseline.sh
```

Expected post-rollback spot checks:

```bash
# composer.json should NOT contain php constraint
grep -q '"php"' starter/composer.json && echo "ROLLBACK FAILED" || echo "ROLLBACK OK"

# workflow should be absent
test ! -f starter/.github/workflows/php-syntax.yml && echo "CI workflow removed OK" || echo "ROLLBACK FAILED"

# gitignore should not have vendor/
grep -q 'vendor/' starter/.gitignore && echo "ROLLBACK FAILED" || echo "ROLLBACK OK"
```

`verify-first-step.sh` is expected to **fail** after rollback (missing `"php"` constraint, `vendor/` ignore, and workflow).

## Risk assessment

| Area | Risk | Notes |
| --- | --- | --- |
| Source files | Low | First step did not modify `src/`, `public/`, or `config/app.php` |
| Dependencies | Low | Rollback removes declared PHP platform only; no `composer.lock` or `vendor/` in repo |
| Build process | Medium | Removing CI workflow eliminates automated syntax gate; regressions may go undetected until manual lint |
| Git history | Low | `git restore` / `git revert` are standard; patch reverse-apply may fail if line context drifted |
| Secrets / env | Low | Rollback removes `.env` from `.gitignore` — increases accidental commit risk if developers created local `.env` files |

## Uncertainties

- **Patch apply path:** `first-step-diff.patch` uses paths relative to `tasks/Advanced/A4/` (`starter/...`). Reverse-apply from the wrong directory may fail; use `--directory` or Option A.
- **Committed vs uncommitted:** If the first step was squashed into the initial starter commit (`531de342`), `git revert` affects the entire starter import, not just the three first-step files — prefer Option A/B for surgical rollback.
- **CI on GitHub:** Local rollback does not disable any workflow already pushed to a remote; delete or revert on the remote branch separately if needed.
- **`verify-baseline.sh` requires PHP:** Baseline verification runs `php -l`; environments without PHP will fail baseline checks even after a correct rollback.
