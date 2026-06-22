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
