from decimal import Decimal

from app.schemas import TransactionCreate, TransactionResponse, TransactionType


class TransactionStore:
    def __init__(self) -> None:
        self._transactions: list[TransactionResponse] = []
        self._next_id = 1

    def add(self, payload: TransactionCreate) -> TransactionResponse:
        if payload.type is TransactionType.DEBIT and self.balance() < payload.amount:
            raise ValueError(
                f"Insufficient funds: balance {self.balance():.2f}, "
                f"requested debit {payload.amount:.2f}"
            )

        transaction = TransactionResponse(
            id=self._next_id,
            amount=payload.amount,
            type=payload.type,
            description=payload.description,
        )
        self._next_id += 1
        self._transactions.append(transaction)
        return transaction

    def list_all(self) -> list[TransactionResponse]:
        return list(self._transactions)

    def balance(self) -> Decimal:
        total = Decimal("0")
        for transaction in self._transactions:
            if transaction.type is TransactionType.CREDIT:
                total += transaction.amount
            else:
                total -= transaction.amount
        return total
