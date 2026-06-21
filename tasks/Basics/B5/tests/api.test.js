import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("Transaction Ledger API", () => {
  let app;
  let store;

  beforeEach(() => {
    ({ app, store } = createApp());
  });

  afterEach(() => {
    store.reset();
  });

  it("creates a credit transaction and returns 201", async () => {
    const response = await request(app)
      .post("/transactions")
      .send({
        amount: "100.50",
        type: "credit",
        description: "Opening deposit",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      amount: "100.50",
      type: "credit",
      description: "Opening deposit",
    });
  });

  it("rejects invalid amounts with 422", async () => {
    const response = await request(app)
      .post("/transactions")
      .send({
        amount: -10,
        type: "credit",
        description: "Invalid amount",
      });

    expect(response.status).toBe(422);
  });

  it("returns balance reflecting credits and debits", async () => {
    await request(app)
      .post("/transactions")
      .send({ amount: "200", type: "credit", description: "Payroll" });
    await request(app)
      .post("/transactions")
      .send({ amount: "50", type: "debit", description: "Groceries" });

    const response = await request(app).get("/balance");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ balance: "150.00" });
  });

  it("allows debit equal to full balance", async () => {
    await request(app)
      .post("/transactions")
      .send({ amount: "100", type: "credit", description: "Seed balance" });

    const response = await request(app)
      .post("/transactions")
      .send({ amount: "100", type: "debit", description: "Full withdraw" });

    expect(response.status).toBe(201);
    expect(response.body.amount).toBe("100.00");
    expect(response.body.type).toBe("debit");

    const balance = await request(app).get("/balance");
    expect(balance.body.balance).toBe("0.00");
  });

  it("rejects debits when funds are insufficient with 400", async () => {
    await request(app)
      .post("/transactions")
      .send({ amount: "50", type: "credit", description: "Seed balance" });

    const response = await request(app)
      .post("/transactions")
      .send({ amount: "100", type: "debit", description: "Overdraw attempt" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toContain("Insufficient funds");
    expect(response.body.detail).toContain("50.00");
    expect(response.body.detail).toContain("100.00");
  });

  it("lists created transactions", async () => {
    await request(app)
      .post("/transactions")
      .send({ amount: "25", type: "credit", description: "Refund" });
    await request(app)
      .post("/transactions")
      .send({ amount: "10", type: "debit", description: "Coffee" });

    const response = await request(app).get("/transactions");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].description).toBe("Refund");
    expect(response.body[1].type).toBe("debit");
  });
});
