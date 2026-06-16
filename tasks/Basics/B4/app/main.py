from fastapi import FastAPI, HTTPException, status

from app.schemas import (
    BalanceResponse,
    TransactionCreate,
    TransactionResponse,
)
from app.store import TransactionStore

app = FastAPI(title="Transaction Ledger", version="1.0.0")
store = TransactionStore()


@app.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(payload: TransactionCreate) -> TransactionResponse:
    try:
        return store.add(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@app.get("/transactions", response_model=list[TransactionResponse])
def list_transactions() -> list[TransactionResponse]:
    return store.list_all()


@app.get("/balance", response_model=BalanceResponse)
def get_balance() -> BalanceResponse:
    return BalanceResponse(balance=store.balance())
