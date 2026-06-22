# Two-terminal execution — I4 Polyglot FastAPI + Node Client

Captured 2026-06-22T18:32:36Z. Run from the repository root.

## Terminal 1 — Start the FastAPI service

```bash
cd tasks/Intermediate/I4/service
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Host and port

- Host: `127.0.0.1`
- Port: `8000`
- Base URL: `http://127.0.0.1:8000`

### Startup logs (actual)

```
INFO:     Started server process [83760]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Leave this terminal running.

## Terminal 2 — Run the Node client

With the service up in Terminal 1:

### Full verification script

```bash
cd tasks/Intermediate/I4/client
node scripts/verify.mjs
```

Output:

```
validation checks passed
live service checks passed
all client verification checks passed
```

Exit code: `0`

### CLI conversion (direct API interaction)

```bash
cd tasks/Intermediate/I4/client
node bin/convert.js 100 USD EUR
```

Output:

```
100 USD = 92 EUR (rate 0.92)
```

Exit code: `0`

### Server access logs (Terminal 1, after client runs)

```
INFO:     127.0.0.1:51292 - "POST /convert HTTP/1.1" 200 OK
INFO:     127.0.0.1:51313 - "GET /health HTTP/1.1" 200 OK
INFO:     127.0.0.1:51314 - "POST /convert HTTP/1.1" 200 OK
INFO:     127.0.0.1:51315 - "POST /convert HTTP/1.1" 200 OK
```

The client hits `GET /health` and `POST /convert`; the CLI issues additional `POST /convert` requests for live conversions.
