# I6 Evaluator Answer Key — DO NOT SHARE WITH CANDIDATES

## Seeded bug (B5)

| Field | Value |
|-------|-------|
| Repo | `tasks/Basics/B5` |
| Symptom | Debit equal to full balance returns 400 instead of 201 |
| Root cause | Off-by-one comparison in debit guard uses `<=` instead of `<` |
| Source | `tasks/Basics/B5/src/store.js:36` |

### Faulty line

```javascript
if (payload.type === "debit" && this.balance() <= amount) {
```

Should be:

```javascript
if (payload.type === "debit" && this.balance() < amount) {
```

When balance is exactly equal to debit amount, `<=` treats it as insufficient funds.

### Failing test (seeded)

`tasks/Basics/B5/tests/api.test.js` — `allows debit equal to full balance`

### Reproduction

```bash
cd tasks/Basics/B5
npm install
npm test -- --run -t "allows debit equal to full balance"
# Expected: FAIL with status 400
```

### Verification after fix

```bash
npm test
# Expected: all tests PASS
```

## Pass criteria

- [ ] Candidate identifies `store.js` comparison without reading this file
- [ ] Fix is one-character or minimal (`<` vs `<=`)
- [ ] All tests pass after fix
- [ ] Risk table mentions API contract (400 vs 201 on exact-balance debit)

## Alternate: reSlim PHP bug (optional)

| Field | Value |
|-------|-------|
| File | `reSlim/src/classes/JSON.php` |
| Lines | ~175–178 |
| Bug | `!empty($decode)` drops valid falsy JSON (`0`, `false`, `""`) |
| Fix | Check `json_last_error() === JSON_ERROR_NONE` instead of `!empty($decode)` |

Requires PHP runtime and `composer install` in `reSlim/src/`.
