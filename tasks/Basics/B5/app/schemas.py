from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float = Field(..., gt=0, description="Amount must be greater than zero")
    description: str = Field(..., min_length=1, max_length=200)


class Transaction(BaseModel):
    id: UUID
    type: TransactionType
    amount: float
    description: str
    created_at: datetime


class BalanceResponse(BaseModel):
    balance: float
    currency: str = "USD"
