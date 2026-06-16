const SUPPORTED = new Set(["USD", "EUR", "GBP", "INR"]);

export function parseArgs(argv) {
  const positional = [];
  let baseUrl = process.env.CONVERTER_URL ?? "http://127.0.0.1:8000";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--url") {
      baseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (token.startsWith("--url=")) {
      baseUrl = token.slice("--url=".length);
      continue;
    }

    if (token === "--help" || token === "-h") {
      return { help: true, baseUrl };
    }

    positional.push(token);
  }

  if (positional.length !== 3) {
    throw new Error("Usage: convert <amount> <from_currency> <to_currency> [--url BASE_URL]");
  }

  const [amountRaw, fromCurrencyRaw, toCurrencyRaw] = positional;
  const amount = Number(amountRaw);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a number greater than zero");
  }

  const fromCurrency = normalizeCurrency(fromCurrencyRaw, "from_currency");
  const toCurrency = normalizeCurrency(toCurrencyRaw, "to_currency");

  return {
    help: false,
    baseUrl: baseUrl.replace(/\/$/, ""),
    amount,
    fromCurrency,
    toCurrency,
  };
}

export function normalizeCurrency(value, fieldName) {
  const code = String(value).trim().toUpperCase();

  if (code.length !== 3 || !/^[A-Z]{3}$/.test(code)) {
    throw new Error(`${fieldName} must be a 3-letter currency code`);
  }

  if (!SUPPORTED.has(code)) {
    throw new Error(
      `${fieldName} '${code}' is not supported locally. Supported: ${[...SUPPORTED].sort().join(", ")}`,
    );
  }

  return code;
}
