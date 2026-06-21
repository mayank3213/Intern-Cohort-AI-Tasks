# Reference first step (graders only — do not commit to starter)

Copy these into `starter/` when validating `verify-first-step.sh`.

## composer.json patch

Add to `require`:

```json
"php": "^8.1"
```

## .gitignore additions

```
vendor/
logs/
.env
.DS_Store
```

## .github/workflows/php-syntax.yml

See EVALUATOR.md example workflow.
