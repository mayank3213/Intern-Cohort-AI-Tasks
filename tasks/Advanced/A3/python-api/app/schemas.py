from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TransactionInput(BaseModel):
    transaction_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    merchant_category: str = Field(min_length=1)
    country: str = Field(min_length=2, max_length=2)
    device_id: str = Field(min_length=1)
    timestamp: datetime

    @field_validator("currency", "country", mode="before")
    @classmethod
    def normalize_uppercase(cls, value: str) -> str:
        return value.upper()


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RiskScoreResult(BaseModel):
    transaction_id: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    reasons: list[str]
    computed_at: datetime


class TransactionStatus(BaseModel):
    transaction_id: str
    status: Literal["pending", "scored"]
    risk_score: Optional[RiskScoreResult] = None


class IngestResponse(BaseModel):
    transaction_id: str
    status: Literal["pending"] = "pending"
