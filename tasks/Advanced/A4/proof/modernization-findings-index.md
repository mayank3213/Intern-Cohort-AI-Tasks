# A4 Modernization Findings Index

Top 5 findings from `agent-run-output-starter.md`, verified against the `starter/` tree (pre-first-step baseline where noted).

| Finding | Source File | Evidence |
| --- | --- | --- |
| No PHP platform constraint in Composer — `require` block had no `"php"` key, so dependency resolution could not enforce a supported runtime | `tasks/Advanced/A4/starter/composer.json` | Baseline `require` at lines 5–8 listed only `monolog/monolog` and `vlucas/phpdotenv` (see `reference-first-step.md`) |
| Documented PHP floor is severely outdated — README claims PHP 5.6+ (last tested on 7.2) while modern runtimes are 8.x | `tasks/Advanced/A4/starter/README.md` | Line 7: `- PHP **5.6+** (last tested on PHP 7.2)` |
| No CI pipeline — no GitHub Actions or other automated verification workflow | `tasks/Advanced/A4/starter/` | `.github/` directory absent before first step (confirmed by `reference-first-step.md`) |
| No automated tests — no PHPUnit config or `tests/` directory; manual curl only | `tasks/Advanced/A4/starter/README.md` | Line 27: `- No automated tests — manual curl only`; no `phpunit.xml` or `tests/` in repo tree |
| Production error details exposed by default — `display_error_details` hardcoded to `true` with no env toggle | `tasks/Advanced/A4/starter/config/app.php` | Line 6: `'display_error_details' => true,` |

## Additional documented findings (not in top 5)

| Finding | Source File | Evidence |
| --- | --- | --- |
| Minimal `.gitignore` (IDE-only before fix) | `tasks/Advanced/A4/starter/.gitignore` | Baseline contained only `.vscode/` (line 1); see `reference-first-step.md` |
| Legacy Monolog 1.x | `tasks/Advanced/A4/starter/composer.json` | Line 7: `"monolog/monolog": "^1.25"` |
| Legacy phpdotenv 2.x | `tasks/Advanced/A4/starter/composer.json` | Line 8: `"vlucas/phpdotenv": "^2.4"` |
| Legacy nginx example references PHP 5 FPM | `tasks/Advanced/A4/starter/example-nginx.conf` | Lines 2, 15: `# Requires php5-fpm...`, `fastcgi_pass unix:/var/run/php5-fpm.sock` |
| No `composer.lock` (non-reproducible installs) | `tasks/Advanced/A4/starter/` | Lockfile absent from tree |

## Source reports

- Primary: `tasks/Advanced/A4/agent-run-output-starter.md` (sections 2–3)
- Alternate golden sample: `tasks/Advanced/A4/agent-run-output-reslim.md`
