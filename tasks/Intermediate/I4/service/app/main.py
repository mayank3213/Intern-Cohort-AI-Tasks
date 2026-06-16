from fastapi import FastAPI, HTTPException, status

from app.rates import SUPPORTED_CURRENCIES, convert_amount
from app.schemas import ConvertRequest, ConvertResponse, CurrenciesResponse

app = FastAPI(title="Currency Converter", version="1.0.0")


def _validate_currency(code: str, field_name: str) -> None:
    if code not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported {field_name}: {code}. Supported: {sorted(SUPPORTED_CURRENCIES)}",
        )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/currencies", response_model=CurrenciesResponse)
def list_currencies() -> CurrenciesResponse:
    return CurrenciesResponse(currencies=sorted(SUPPORTED_CURRENCIES))


@app.post("/convert", response_model=ConvertResponse)
def convert(payload: ConvertRequest) -> ConvertResponse:
    _validate_currency(payload.from_currency, "from_currency")
    _validate_currency(payload.to_currency, "to_currency")

    converted_amount, rate = convert_amount(
        payload.amount,
        payload.from_currency,
        payload.to_currency,
    )

    return ConvertResponse(
        amount=payload.amount,
        from_currency=payload.from_currency,
        to_currency=payload.to_currency,
        converted_amount=converted_amount,
        rate=rate,
    )
