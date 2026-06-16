import json
import os
from pathlib import Path
from typing import Optional, Tuple

from app.schemas import RiskScoreResult, TransactionInput


def data_dir() -> Path:
    root = os.environ.get("FRAUD_DATA_DIR")
    if root:
        base = Path(root)
    else:
        base = Path(__file__).resolve().parents[2] / "data"
    pending = base / "pending"
    completed = base / "completed"
    pending.mkdir(parents=True, exist_ok=True)
    completed.mkdir(parents=True, exist_ok=True)
    return base


def pending_path(transaction_id: str) -> Path:
    return data_dir() / "pending" / f"{transaction_id}.json"


def completed_path(transaction_id: str) -> Path:
    return data_dir() / "completed" / f"{transaction_id}.json"


def enqueue(transaction: TransactionInput) -> None:
    path = pending_path(transaction.transaction_id)
    if path.exists():
        raise FileExistsError(transaction.transaction_id)

    payload = transaction.model_dump(mode="json")
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def get_status(transaction_id: str) -> Tuple[str, Optional[RiskScoreResult]]:
    completed = completed_path(transaction_id)
    if completed.exists():
        data = json.loads(completed.read_text(encoding="utf-8"))
        return "scored", RiskScoreResult.model_validate(data)

    pending = pending_path(transaction_id)
    if pending.exists():
        return "pending", None

    raise KeyError(transaction_id)
