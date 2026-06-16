import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

export function resolveDataDir() {
  return process.env.FRAUD_DATA_DIR
    ? path.resolve(process.env.FRAUD_DATA_DIR)
    : path.join(projectRoot, "data");
}

export function resolveScorerBinary() {
  if (process.env.FRAUD_SCORER_BIN) {
    return path.resolve(process.env.FRAUD_SCORER_BIN);
  }

  const releaseBinary = path.join(
    projectRoot,
    "rust-scorer",
    "target",
    "release",
    process.platform === "win32" ? "fraud-scorer.exe" : "fraud-scorer",
  );
  return releaseBinary;
}

export function resolvePollIntervalMs() {
  const raw = process.env.WORKER_POLL_MS ?? "500";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

export async function ensureQueueDirs(dataDir = resolveDataDir()) {
  await fs.mkdir(path.join(dataDir, "pending"), { recursive: true });
  await fs.mkdir(path.join(dataDir, "completed"), { recursive: true });
  return dataDir;
}
