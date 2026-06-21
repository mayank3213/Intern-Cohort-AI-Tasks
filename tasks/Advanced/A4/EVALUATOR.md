# A4 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Target

| Field | Value |
|-------|-------|
| Task root | `tasks/Advanced/A4` |
| Candidate repo | `tasks/Advanced/A4/starter/` |
| Stack | PHP, Composer, built-in server, Monolog 1.x |

## Expected findings (minimum 4)

Candidates should discover these from the repo (not from this file):

| ID | Finding | Evidence |
|----|---------|----------|
| F1 | No `php` platform in Composer | `starter/composer.json` — no `php` key in `require` |
| F2 | No `composer.lock` | lockfile absent from `starter/` |
| F3 | No CI workflow | `.github/` absent |
| F4 | No automated tests | no `phpunit.xml`, no `tests/` |
| F5 | Outdated README PHP floor | `starter/README.md` — claims PHP 5.6+ |
| F6 | Error details enabled | `starter/config/app.php:6` — `display_error_details => true` |
| F7 | Minimal gitignore | `starter/.gitignore` — IDE-only, no `vendor/` or `logs/` |
| F8 | Legacy nginx example | `starter/example-nginx.conf` — `php5-fpm.sock` |
| F9 | Old Monolog major | `starter/composer.json` — `monolog/monolog: ^1.25` |

## Recommended first step (rank #1)

**PHP platform baseline + expanded `.gitignore` + GitHub Actions PHP syntax gate**

Matches doc safety budget and A4 golden sample pattern.

### Expected file changes

| File | Change |
|------|--------|
| `starter/composer.json` | Add `"php": "^8.1"` or `"^7.4 \|\| ^8.0"` to `require` |
| `starter/.gitignore` | Add `vendor/`, `logs/`, `.env`, OS cruft |
| `starter/.github/workflows/php-syntax.yml` | `php -l` on `src/` and `public/` on push/PR |

### Example workflow (reference)

```yaml
name: PHP Syntax

on:
  push:
    branches: ["**"]
  pull_request:

jobs:
  syntax:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.2"
      - name: Lint PHP sources
        run: |
          find src public -name '*.php' -print0 | xargs -0 -n1 php -l
```

## Verification

### Baseline (before changes)

```bash
cd tasks/Advanced/A4
chmod +x scripts/*.sh
./scripts/verify-baseline.sh
```

### After candidate first step

```bash
./scripts/verify-first-step.sh
```

Manual:

```bash
cd starter
grep '"php"' composer.json
grep vendor/ .gitignore
test -f .github/workflows/php-syntax.yml
find src public -name '*.php' -print0 | xargs -0 -n1 php -l
```

## Pass criteria

- [ ] ≥4 findings with `source: path:line` citations from `starter/`
- [ ] Prioritized plan with scoring; first step is lowest-risk top item
- [ ] First step ≤3 config/prod files, ≤80 lines, no app logic rewrite
- [ ] `verify-first-step.sh` passes (or equivalent manual checks)
- [ ] Rollback section mentions `git checkout` / revert per file

## Rollback reference

```bash
cd tasks/Advanced/A4/starter
git checkout -- composer.json .gitignore
rm -rf .github/workflows/php-syntax.yml
# remove .github/ if empty
```

## Out of scope for first step (reject if candidate did these)

- Monolog 2.x / 3.x upgrade
- Adding PHPUnit suite (valid as rank #2–3, not first step)
- Changing `App.php` business logic
- Slim/Laravel migration

## Alternate target

`reSlim/` at repo root — see [`agent-run-output-reslim.md`](agent-run-output-reslim.md) for golden sample output.
