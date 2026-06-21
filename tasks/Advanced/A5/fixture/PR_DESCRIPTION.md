# [AGENT] Modernize Contact API + add SQLite search

**Branch:** `feature/agent-modernize-search`  
**Base:** `main` (A4 `starter/` baseline)  
**Author:** coding-agent / modernization-first-stepper follow-up

## Summary

This PR modernizes the legacy Contact API starter:

- Declares PHP 8.1+ platform in Composer
- Expands `.gitignore` for vendor and logs
- Adds GitHub Actions PHP syntax check
- Migrates contact reads/writes to SQLite
- Adds `GET /contacts/search?q=` full-text lookup

## Motivation

Follow-up to A4 modernization — adds persistent storage and a search endpoint requested in ticket **CONTACT-42**.

## Test plan

- [x] Manual curl on `/health` and `/contacts`
- [x] `php -l` on changed files locally
- [ ] Automated tests (deferred — no PHPUnit in baseline)

## Checklist

- [x] Composer platform updated
- [x] CI workflow added
- [x] New search endpoint documented in PR description
- [ ] Security review (agent self-approved)

## How to review

Review the diff in [`agent-change.patch`](agent-change.patch) against [`../A4/starter/`](../A4/starter/).

Do **not** merge without human review — agent-generated.
