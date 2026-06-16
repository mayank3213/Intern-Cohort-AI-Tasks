import json

from app.queue_store import completed_path, pending_path


def test_health(client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ingest_writes_pending_file(client) -> None:
    payload = {
        "transaction_id": "tx-api-001",
        "amount": 250.0,
        "currency": "usd",
        "merchant_category": "retail",
        "country": "us",
        "device_id": "device-1",
        "timestamp": "2025-06-17T14:30:00Z",
    }

    response = client.post("/transactions", json=payload)

    assert response.status_code == 202
    body = response.json()
    assert body["transaction_id"] == "tx-api-001"
    assert body["status"] == "pending"

    pending_file = pending_path("tx-api-001")
    assert pending_file.exists()
    stored = json.loads(pending_file.read_text(encoding="utf-8"))
    assert stored["currency"] == "USD"
    assert stored["country"] == "US"


def test_get_pending_transaction(client) -> None:
    client.post(
        "/transactions",
        json={
            "transaction_id": "tx-pending",
            "amount": 10,
            "currency": "USD",
            "merchant_category": "retail",
            "country": "US",
            "device_id": "dev",
            "timestamp": "2025-06-17T10:00:00Z",
        },
    )

    response = client.get("/transactions/tx-pending")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "pending"
    assert body["risk_score"] is None


def test_get_scored_transaction(client) -> None:
    score = {
        "transaction_id": "tx-done",
        "risk_score": 45,
        "risk_level": "MEDIUM",
        "reasons": ["foreign_country"],
        "computed_at": "2025-06-17T10:00:01Z",
    }
    completed_path("tx-done").write_text(json.dumps(score), encoding="utf-8")

    response = client.get("/transactions/tx-done")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "scored"
    assert body["risk_score"]["risk_level"] == "MEDIUM"


def test_rejects_invalid_amount(client) -> None:
    response = client.post(
        "/transactions",
        json={
            "transaction_id": "tx-bad",
            "amount": 0,
            "currency": "USD",
            "merchant_category": "retail",
            "country": "US",
            "device_id": "dev",
            "timestamp": "2025-06-17T10:00:00Z",
        },
    )

    assert response.status_code == 422


def test_duplicate_transaction_returns_conflict(client) -> None:
    payload = {
        "transaction_id": "tx-dup",
        "amount": 50,
        "currency": "USD",
        "merchant_category": "retail",
        "country": "US",
        "device_id": "dev",
        "timestamp": "2025-06-17T10:00:00Z",
    }

    first = client.post("/transactions", json=payload)
    second = client.post("/transactions", json=payload)

    assert first.status_code == 202
    assert second.status_code == 409
