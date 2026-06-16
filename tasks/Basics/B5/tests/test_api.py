def test_create_deposit_and_get_balance(client):
    response = client.post(
        "/transactions",
        json={"type": "deposit", "amount": 100.0, "description": "Paycheck"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["type"] == "deposit"
    assert body["amount"] == 100.0
    assert body["description"] == "Paycheck"
    assert "id" in body
    assert "created_at" in body

    balance = client.get("/balance")
    assert balance.status_code == 200
    assert balance.json() == {"balance": 100.0, "currency": "USD"}


def test_list_transactions_returns_created_items(client):
    client.post(
        "/transactions",
        json={"type": "deposit", "amount": 50.0, "description": "Refund"},
    )
    client.post(
        "/transactions",
        json={"type": "withdrawal", "amount": 20.0, "description": "Coffee"},
    )

    response = client.get("/transactions")
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) == 2
    assert transactions[0]["description"] == "Refund"
    assert transactions[1]["description"] == "Coffee"


def test_withdrawal_rejected_when_insufficient_funds(client):
    response = client.post(
        "/transactions",
        json={"type": "withdrawal", "amount": 25.0, "description": "Groceries"},
    )
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


def test_invalid_amount_rejected_by_validation(client):
    response = client.post(
        "/transactions",
        json={"type": "deposit", "amount": -10.0, "description": "Bad deposit"},
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(err["loc"][-1] == "amount" for err in detail)


def test_empty_description_rejected_by_validation(client):
    response = client.post(
        "/transactions",
        json={"type": "deposit", "amount": 10.0, "description": ""},
    )
    assert response.status_code == 422
