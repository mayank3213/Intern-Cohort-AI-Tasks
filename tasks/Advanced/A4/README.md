# A4 — Repository Modernization Plan + First Step (90 min)

Analyze a **legacy PHP API** for modernization opportunities, prioritize them, then implement the **single highest-value, lowest-risk first step**. Verify with real commands and document rollback.

## Target repo

**Primary:** [`starter/`](starter/) — self-contained legacy Contact API (intentional gaps).

**Alternate:** `extras/cloned-repos/reSlim/` at `extras/cloned-repos/reSlim/` (larger; use only if instructed).

## Intentional gaps in `starter/` (discovery exercise)

The starter ships with known legacy signals — your job is to **find them with evidence**, not memorize this list:

| Area | Signal to look for |
|------|-------------------|
| Dependencies | Old Monolog 1.x, no `composer.lock` |
| Platform | README claims PHP 5.6+; `composer.json` has no `php` constraint |
| CI | No `.github/workflows/` |
| Tests | No PHPUnit/Pest — manual curl only |
| Security | `display_error_details => true` in config |
| Hygiene | Minimal `.gitignore` (IDE-only) |
| Docs | `example-nginx.conf` references `php5-fpm` |

## Deliverables

Submit one markdown report (or PR) with these sections **in order**:

1. **Findings with evidence** — 4–10 items; each with `source: path:line-range`
2. **Prioritized plan** — table with value/risk/effort/confidence scores
3. **First step implemented** — exactly **one** low-risk change (≤3 prod/config files, ≤80 lines)
4. **Verification** — commands run + verbatim output (lint/CI/syntax)
5. **Rollback notes** — how to undo the first step safely

### Recommended first step (doc-aligned)

Pick the top-ranked item that fits the safety budget:

- PHP platform constraint in `composer.json` (`"php": "^8.1"` or `^7.4 || ^8.0`)
- Expand `.gitignore` for `vendor/`, `logs/`, `.env`
- Add GitHub Actions **PHP syntax check** ( `php -l` on `src/` + `public/` )

Do **not** implement Slim migrations, dependency major bumps, or app logic refactors as the first step.

## Time box

| Phase | Minutes |
|-------|---------|
| Baseline scan + findings | 30 |
| Prioritized plan | 15 |
| Implement first step | 30 |
| Verify + rollback notes | 15 |

## Setup

```bash
cd tasks/Advanced/A4/starter

# Optional: install deps to run the API locally
composer install
php -S 127.0.0.1:8080 -t public

# Baseline syntax check (no vendor required)
../scripts/verify-baseline.sh
```

Manual smoke:

```bash
curl -s http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/contacts
```

## Pass criteria

- [ ] Findings cite real files in `starter/` (not generic advice)
- [ ] Plan ranks ≥4 opportunities with explicit scoring
- [ ] First step is **low-risk** (config/CI/gitignore/platform pin — not framework migration)
- [ ] ≤3 production/config files changed, ≤80 lines
- [ ] Verification command passes after change
- [ ] Rollback documented (git revert or file restore)

## Safety budget (first step)

| Metric | Limit |
|--------|-------|
| Production/config files changed | ≤ 3 |
| Test/CI files changed | ≤ 2 |
| Lines changed | ≤ 80 |
| New runtime dependencies | 0 preferred |

## Layout

```
A4/
├── README.md
├── starter/                 # legacy baseline (candidate target)
├── scripts/
│   ├── verify-baseline.sh
│   └── verify-first-step.sh
├── modernization-first-stepper.md
└── agent-run-output-reslim.md   # golden sample (reSlim variant)
```

## Agent workflow

For AI-assisted runs, see [`modernization-first-stepper.md`](modernization-first-stepper.md).

Golden sample (reSlim): [`agent-run-output-reslim.md`](agent-run-output-reslim.md).
