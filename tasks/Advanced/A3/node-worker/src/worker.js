import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  ensureQueueDirs,
  resolveDataDir,
  resolvePollIntervalMs,
  resolveScorerBinary,
} from "./config.js";

export async function scoreTransactionFile(pendingFile, options = {}) {
  const dataDir = options.dataDir ?? resolveDataDir();
  const scorerBin = options.scorerBin ?? resolveScorerBinary();
  const invoke = options.invoke ?? ((bin, file) => invokeScorer(bin, file));

  const raw = await fs.readFile(pendingFile, "utf8");
  const transaction = JSON.parse(raw);

  const scoreJson = await invoke(scorerBin, pendingFile);
  const score = JSON.parse(scoreJson);

  if (score.transaction_id !== transaction.transaction_id) {
    throw new Error(
      `score transaction_id mismatch: expected ${transaction.transaction_id}, got ${score.transaction_id}`,
    );
  }

  const completedDir = path.join(dataDir, "completed");
  const completedFile = path.join(completedDir, `${transaction.transaction_id}.json`);
  await fs.writeFile(completedFile, `${JSON.stringify(score, null, 2)}\n`, "utf8");
  await fs.unlink(pendingFile);

  return score;
}

export function invokeScorer(scorerBin, pendingFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(scorerBin, ["score", "--file", pendingFile], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `scorer exited with code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export async function listPendingFiles(dataDir = resolveDataDir()) {
  const pendingDir = path.join(dataDir, "pending");
  const entries = await fs.readdir(pendingDir);
  return entries
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(pendingDir, name))
    .sort();
}

export async function processPendingOnce(options = {}) {
  const dataDir = options.dataDir ?? resolveDataDir();
  await ensureQueueDirs(dataDir);

  const pendingFiles = await listPendingFiles(dataDir);
  const results = [];

  for (const pendingFile of pendingFiles) {
    const score = await scoreTransactionFile(pendingFile, options);
    results.push(score);
  }

  return results;
}

export async function runWorker(options = {}) {
  const pollMs = options.pollIntervalMs ?? resolvePollIntervalMs();
  const dataDir = options.dataDir ?? resolveDataDir();
  await ensureQueueDirs(dataDir);

  console.log(
    `worker started | data=${dataDir} | scorer=${options.scorerBin ?? resolveScorerBinary()} | poll=${pollMs}ms`,
  );

  while (true) {
    try {
      const processed = await processPendingOnce(options);
      if (processed.length > 0) {
        for (const score of processed) {
          console.log(
            `scored ${score.transaction_id} -> ${score.risk_level} (${score.risk_score})`,
          );
        }
      }
    } catch (error) {
      console.error(`worker error: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  runWorker().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
