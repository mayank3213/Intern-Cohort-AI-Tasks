from uuid import uuid4

from fastapi import FastAPI, HTTPException, status

from app.queue_store import enqueue, get_status
from app.schemas import IngestResponse, TransactionInput, TransactionStatus

app = FastAPI(title="Fraud Score Ingestion API", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/transactions", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
def ingest_transaction(payload: TransactionInput) -> IngestResponse:
    transaction = payload
    if not transaction.transaction_id.strip():
        transaction = payload.model_copy(update={"transaction_id": f"tx-{uuid4().hex[:12]}"})

    try:
        enqueue(transaction)
    except FileExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transaction already exists: {exc.args[0]}",
        ) from exc

    return IngestResponse(transaction_id=transaction.transaction_id)


@app.get("/transactions/{transaction_id}", response_model=TransactionStatus)
def read_transaction(transaction_id: str) -> TransactionStatus:
    try:
        tx_status, score = get_status(transaction_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction not found: {transaction_id}",
        ) from exc

    return TransactionStatus(
        transaction_id=transaction_id,
        status=tx_status,
        risk_score=score,
    )
