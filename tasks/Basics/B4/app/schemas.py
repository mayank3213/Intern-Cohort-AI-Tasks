from decimal import Decimal
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, field_serializer, field_validator


class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class TransactionCreate(BaseModel):
    amount: Annotated[Decimal, Field(gt=0, decimal_places=2, max_digits=12)]
    type: TransactionType
    description: Annotated[str, Field(min_length=1, max_length=200)]

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, value: object) -> object:
        if isinstance(value, (int, float, str)):
            return Decimal(str(value))
        return value


class TransactionResponse(BaseModel):
    id: int
    amount: Decimal
    type: TransactionType
    description: str


class BalanceResponse(BaseModel):
    balance: Decimal

    @field_serializer("balance")
    def serialize_balance(self, value: Decimal) -> str:
        return f"{value:.2f}"
