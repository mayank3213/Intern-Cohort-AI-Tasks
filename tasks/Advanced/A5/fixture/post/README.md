# Legacy Contact API (A4 starter)

Small PHP JSON API — **intentionally outdated** baseline for the A4 modernization exercise.

## Requirements (documented)

- PHP **5.6+** (last tested on PHP 7.2)
- Composer 1.x

## Setup

```bash
composer install
php -S 127.0.0.1:8080 -t public
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/contacts` | List contacts (in-memory) |
| POST | `/contacts` | Create contact |

## Notes

- No automated tests — manual curl only
- Logs written to `logs/app.log` (create directory manually)
