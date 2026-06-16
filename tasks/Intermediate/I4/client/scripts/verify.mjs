import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { convertCurrency } from "../src/client.js";
import { normalizeCurrency, parseArgs } from "../src/validate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const convertBin = path.join(clientRoot, "bin", "convert.js");
const baseUrl = process.env.CONVERTER_URL ?? "http://127.0.0.1:8000";

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: clientRoot,
      env: { ...process.env, CONVERTER_URL: baseUrl },
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

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
    child.on("error", reject);
  });
}

async function verifyValidation() {
  assert.throws(
    () => parseArgs(["0", "USD", "EUR"]),
    /Amount must be a number greater than zero/,
  );

  assert.throws(
    () => normalizeCurrency("US", "from_currency"),
    /must be a 3-letter currency code/,
  );

  assert.throws(
    () => normalizeCurrency("JPY", "to_currency"),
    /not supported locally/,
  );

  console.log("validation checks passed");
}

async function verifyLiveService() {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200, "service health check failed");

  const result = await convertCurrency({
    baseUrl,
    amount: 100,
    fromCurrency: "USD",
    toCurrency: "EUR",
  });

  assert.equal(result.converted_amount, 92);
  assert.equal(result.rate, 0.92);

  const cli = await runNode([convertBin, "25", "GBP", "USD"]);
  assert.equal(cli.code, 0, cli.stderr);
  assert.match(cli.stdout, /25 GBP = .* USD/);

  const badAmount = await runNode([convertBin, "-1", "USD", "EUR"]);
  assert.notEqual(badAmount.code, 0);
  assert.match(badAmount.stderr, /Amount must be a number greater than zero/);

  console.log("live service checks passed");
}

async function main() {
  await verifyValidation();

  try {
    await verifyLiveService();
  } catch (error) {
    console.error(
      "live service checks skipped or failed:",
      error.message ?? error,
    );
    console.error(
      "Start the FastAPI service first, then rerun: npm run verify",
    );
    process.exit(1);
  }

  console.log("all client verification checks passed");
}

main();
