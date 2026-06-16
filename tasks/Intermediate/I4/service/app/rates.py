"""Hardcoded exchange rates relative to USD."""

RATES_USD: dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "INR": 83.12,
}

SUPPORTED_CURRENCIES = frozenset(RATES_USD)


def convert_amount(amount: float, from_currency: str, to_currency: str) -> tuple[float, float]:
    """Return (converted_amount, effective_rate) using USD as the base currency."""
    from_rate = RATES_USD[from_currency]
    to_rate = RATES_USD[to_currency]
    effective_rate = to_rate / from_rate
    converted = amount * effective_rate
    return round(converted, 2), round(effective_rate, 6)
