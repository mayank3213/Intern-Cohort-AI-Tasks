from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.schemas import Transaction, TransactionCreate, TransactionType


class InsufficientFundsError(Exception):
    pass


class TransactionStore:
    def __init__(self) -> None:
        self._transactions: list[Transaction] = []
        self._balance: float = 0.0

    def create(self, payload: TransactionCreate) -> Transaction:
        if payload.type == TransactionType.WITHDRAWAL and payload.amount > self._balance:
            raise InsufficientFundsError(
                f"Insufficient funds: balance is {self._balance}, requested {payload.amount}"
            )

        transaction = Transaction(
            id=uuid4(),
            type=payload.type,
            amount=payload.amount,
            description=payload.description,
            created_at=datetime.now(timezone.utc),
        )
        self._transactions.append(transaction)

        if payload.type == TransactionType.DEPOSIT:
            self._balance += payload.amount
        else:
            self._balance -= payload.amount

        return transaction

    def list_all(self) -> list[Transaction]:
        return list(self._transactions)

    def get_balance(self) -> float:
        return self._balance

    def reset(self) -> None:
        self._transactions.clear()
        self._balance = 0.0


store = TransactionStore()
