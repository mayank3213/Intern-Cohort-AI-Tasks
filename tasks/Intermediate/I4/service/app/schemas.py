from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class ConvertRequest(BaseModel):
    amount: Annotated[float, Field(gt=0, description="Amount must be greater than zero")]
    from_currency: Annotated[str, Field(min_length=3, max_length=3)]
    to_currency: Annotated[str, Field(min_length=3, max_length=3)]

    @field_validator("from_currency", "to_currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized.isalpha():
            raise ValueError("Currency code must contain letters only")
        return normalized


class ConvertResponse(BaseModel):
    amount: float
    from_currency: str
    to_currency: str
    converted_amount: float
    rate: float


class CurrenciesResponse(BaseModel):
    currencies: list[str]
