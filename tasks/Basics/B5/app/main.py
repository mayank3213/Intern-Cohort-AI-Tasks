from fastapi import FastAPI, HTTPException, status

from app.schemas import BalanceResponse, Transaction, TransactionCreate
from app.store import InsufficientFundsError, store

app = FastAPI(
    title="Transaction Ledger API",
    description="Simple in-memory transaction and balance service.",
    version="1.0.0",
)


@app.post(
    "/transactions",
    response_model=Transaction,
    status_code=status.HTTP_201_CREATED,
    summary="Create a deposit or withdrawal",
)
def create_transaction(payload: TransactionCreate) -> Transaction:
    try:
        return store.create(payload)
    except InsufficientFundsError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@app.get(
    "/transactions",
    response_model=list[Transaction],
    summary="List all transactions",
)
def list_transactions() -> list[Transaction]:
    return store.list_all()


@app.get(
    "/balance",
    response_model=BalanceResponse,
    summary="Get current account balance",
)
def get_balance() -> BalanceResponse:
    return BalanceResponse(balance=store.get_balance())
