const TRANSACTION_TYPES = new Set(["credit", "debit"]);

function formatAmount(value) {
  return Number(value).toFixed(2);
}

function parseAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(numeric * 100) / 100;
}

export class TransactionStore {
  constructor() {
    this._transactions = [];
    this._nextId = 1;
  }

  add(payload) {
    const amount = parseAmount(payload.amount);
    if (amount === null || amount <= 0) {
      throw new ValidationError("amount must be greater than zero");
    }

    if (!TRANSACTION_TYPES.has(payload.type)) {
      throw new ValidationError('type must be "credit" or "debit"');
    }

    const description = payload.description?.trim?.() ?? "";
    if (description.length < 1 || description.length > 200) {
      throw new ValidationError("description must be 1-200 characters");
    }

    if (payload.type === "debit" && this.balance() < amount) {
      throw new InsufficientFundsError(
        `Insufficient funds: balance ${formatAmount(this.balance())}, requested debit ${formatAmount(amount)}`,
      );
    }

    const transaction = {
      id: this._nextId,
      amount: formatAmount(amount),
      type: payload.type,
      description,
    };

    this._nextId += 1;
    this._transactions.push(transaction);
    return transaction;
  }

  listAll() {
    return [...this._transactions];
  }

  balance() {
    return this._transactions.reduce((total, transaction) => {
      const amount = parseAmount(transaction.amount);
      return transaction.type === "credit" ? total + amount : total - amount;
    }, 0);
  }

  reset() {
    this._transactions = [];
    this._nextId = 1;
  }
}

export class InsufficientFundsError extends Error {
  constructor(message) {
    super(message);
    this.name = "InsufficientFundsError";
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}
