import { normalizeCurrency } from "./validate.js";

export async function convertCurrency({
  baseUrl,
  amount,
  fromCurrency,
  toCurrency,
}) {
  const payload = {
    amount,
    from_currency: normalizeCurrency(fromCurrency, "from_currency"),
    to_currency: normalizeCurrency(toCurrency, "to_currency"),
  };

  const response = await fetch(`${baseUrl}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : JSON.stringify(body.detail ?? body);
    throw new Error(`Service error (${response.status}): ${detail}`);
  }

  return body;
}
