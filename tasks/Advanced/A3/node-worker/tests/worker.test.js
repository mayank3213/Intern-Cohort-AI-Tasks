import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveScorerBinary } from "../src/config.js";
import {
  invokeScorer,
  processPendingOnce,
  scoreTransactionFile,
} from "../src/worker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const fixturePath = path.join(projectRoot, "tests", "fixtures", "high_risk.json");

async function scorerAvailable() {
  try {
    await fs.access(resolveScorerBinary());
    return true;
  } catch {
    return false;
  }
}

async function makeTempQueue() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "fraud-worker-"));
  await fs.mkdir(path.join(dataDir, "pending"), { recursive: true });
  await fs.mkdir(path.join(dataDir, "completed"), { recursive: true });
  return dataDir;
}

test("invokeScorer returns JSON risk payload", async (t) => {
  if (!(await scorerAvailable())) {
    t.skip("fraud-scorer binary not built; run `cargo build --release` in rust-scorer");
  }

  const scorerBin = resolveScorerBinary();
  const output = await invokeScorer(scorerBin, fixturePath);
  const parsed = JSON.parse(output);

  assert.equal(parsed.transaction_id, "tx-cli-001");
  assert.equal(typeof parsed.risk_score, "number");
  assert.ok(["LOW", "MEDIUM", "HIGH"].includes(parsed.risk_level));
  assert.ok(Array.isArray(parsed.reasons));
});

test("processPendingOnce scores queued transaction", async (t) => {
  if (!(await scorerAvailable())) {
    t.skip("fraud-scorer binary not built; run `cargo build --release` in rust-scorer");
  }

  const dataDir = await makeTempQueue();
  const pendingFile = path.join(dataDir, "pending", "tx-worker-001.json");
  const tx = {
    transaction_id: "tx-worker-001",
    amount: 1200,
    currency: "USD",
    merchant_category: "retail",
    country: "GB",
    device_id: "device-worker",
    timestamp: "2025-06-17T11:00:00Z",
  };

  await fs.writeFile(pendingFile, `${JSON.stringify(tx, null, 2)}\n`, "utf8");

  const results = await processPendingOnce({
    dataDir,
    scorerBin: resolveScorerBinary(),
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].transaction_id, "tx-worker-001");
  assert.equal(results[0].risk_level, "MEDIUM");

  const completedExists = await fs
    .access(path.join(dataDir, "completed", "tx-worker-001.json"))
    .then(() => true)
    .catch(() => false);
  assert.equal(completedExists, true);

  const pendingExists = await fs
    .access(pendingFile)
    .then(() => true)
    .catch(() => false);
  assert.equal(pendingExists, false);
});

test("scoreTransactionFile rejects transaction_id mismatch", async () => {
  const dataDir = await makeTempQueue();
  const pendingFile = path.join(dataDir, "pending", "tx-mismatch.json");
  const tx = {
    transaction_id: "tx-mismatch",
    amount: 10,
    currency: "USD",
    merchant_category: "retail",
    country: "US",
    device_id: "device",
    timestamp: "2025-06-17T10:00:00Z",
  };

  await fs.writeFile(pendingFile, `${JSON.stringify(tx, null, 2)}\n`, "utf8");

  await assert.rejects(
    () =>
      scoreTransactionFile(pendingFile, {
        dataDir,
        scorerBin: resolveScorerBinary(),
        invoke: async () =>
          JSON.stringify({
            transaction_id: "other-id",
            risk_score: 1,
            risk_level: "LOW",
            reasons: [],
            computed_at: "2025-06-17T10:00:01Z",
          }),
      }),
    /transaction_id mismatch/,
  );
});
