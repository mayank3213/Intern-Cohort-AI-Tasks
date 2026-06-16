def test_convert_usd_to_eur(client) -> None:
    response = client.post(
        "/convert",
        json={"amount": 100, "from_currency": "USD", "to_currency": "EUR"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["amount"] == 100
    assert body["from_currency"] == "USD"
    assert body["to_currency"] == "EUR"
    assert body["converted_amount"] == 92.0
    assert body["rate"] == 0.92


def test_convert_normalizes_currency_case(client) -> None:
    response = client.post(
        "/convert",
        json={"amount": 10, "from_currency": "usd", "to_currency": "eur"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["from_currency"] == "USD"
    assert body["to_currency"] == "EUR"
    assert body["converted_amount"] == 9.2


def test_convert_rejects_non_positive_amount(client) -> None:
    response = client.post(
        "/convert",
        json={"amount": 0, "from_currency": "USD", "to_currency": "EUR"},
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(err["loc"][-1] == "amount" for err in detail)


def test_convert_rejects_invalid_currency_code_length(client) -> None:
    response = client.post(
        "/convert",
        json={"amount": 50, "from_currency": "US", "to_currency": "EUR"},
    )

    assert response.status_code == 422


def test_convert_rejects_unsupported_currency(client) -> None:
    response = client.post(
        "/convert",
        json={"amount": 50, "from_currency": "USD", "to_currency": "JPY"},
    )

    assert response.status_code == 400
    assert "Unsupported to_currency" in response.json()["detail"]


def test_list_currencies(client) -> None:
    response = client.get("/currencies")

    assert response.status_code == 200
    assert response.json()["currencies"] == ["EUR", "GBP", "INR", "USD"]
