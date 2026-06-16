#!/usr/bin/env node

import { convertCurrency } from "../src/client.js";
import { parseArgs } from "../src/validate.js";

function printHelp() {
  console.log(`Usage: convert <amount> <from_currency> <to_currency> [--url BASE_URL]

Examples:
  node bin/convert.js 100 USD EUR
  CONVERTER_URL=http://127.0.0.1:8000 node bin/convert.js 50 GBP INR

Environment:
  CONVERTER_URL   Base URL for the FastAPI service (default: http://127.0.0.1:8000)
`);
}

async function main() {
  try {
    const parsed = parseArgs(process.argv.slice(2));

    if (parsed.help) {
      printHelp();
      return;
    }

    const result = await convertCurrency(parsed);

    console.log(
      `${result.amount} ${result.from_currency} = ${result.converted_amount} ${result.to_currency} (rate ${result.rate})`,
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
