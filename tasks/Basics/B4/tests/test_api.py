import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store() -> None:
    from app import main
    from app.store import TransactionStore

    main.store = TransactionStore()


def test_create_credit_transaction_returns_201() -> None:
    response = client.post(
        "/transactions",
        json={
            "amount": "100.50",
            "type": "credit",
            "description": "Opening deposit",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["amount"] == "100.50"
    assert body["type"] == "credit"
    assert body["description"] == "Opening deposit"


def test_invalid_amount_is_rejected_with_422() -> None:
    response = client.post(
        "/transactions",
        json={
            "amount": -10,
            "type": "credit",
            "description": "Invalid amount",
        },
    )

    assert response.status_code == 422


def test_balance_reflects_credits_and_debits() -> None:
    client.post(
        "/transactions",
        json={"amount": "200", "type": "credit", "description": "Payroll"},
    )
    client.post(
        "/transactions",
        json={"amount": "50", "type": "debit", "description": "Groceries"},
    )

    response = client.get("/balance")

    assert response.status_code == 200
    assert response.json()["balance"] == "150.00"


def test_debit_rejected_when_insufficient_funds_returns_400() -> None:
    client.post(
        "/transactions",
        json={"amount": "50", "type": "credit", "description": "Seed balance"},
    )

    response = client.post(
        "/transactions",
        json={"amount": "100", "type": "debit", "description": "Overdraw attempt"},
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "Insufficient funds" in detail
    assert "50.00" in detail
    assert "100.00" in detail


def test_list_transactions_returns_created_items() -> None:
    client.post(
        "/transactions",
        json={"amount": "25", "type": "credit", "description": "Refund"},
    )
    client.post(
        "/transactions",
        json={"amount": "10", "type": "debit", "description": "Coffee"},
    )

    response = client.get("/transactions")

    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) == 2
    assert transactions[0]["description"] == "Refund"
    assert transactions[1]["type"] == "debit"
