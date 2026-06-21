import express from "express";
import {
  InsufficientFundsError,
  TransactionStore,
  ValidationError,
} from "./store.js";

export function createApp(store = new TransactionStore()) {
  const app = express();
  app.use(express.json());

  app.post("/transactions", (req, res) => {
    try {
      const transaction = store.add(req.body ?? {});
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(422).json({ detail: error.message });
        return;
      }
      if (error instanceof InsufficientFundsError) {
        res.status(400).json({ detail: error.message });
        return;
      }
      throw error;
    }
  });

  app.get("/transactions", (_req, res) => {
    res.json(store.listAll());
  });

  app.get("/balance", (_req, res) => {
    res.json({ balance: store.balance().toFixed(2) });
  });

  return { app, store };
}
