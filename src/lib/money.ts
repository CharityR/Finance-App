/**
 * Money is always stored as a decimal string/number pair (amount + currency)
 * end-to-end — never as a float used for arithmetic across services. Drizzle
 * (via postgres-js) returns `numeric(19,4)` columns as strings; convert with
 * `Number(...)` only at the service boundary, right before it reaches JSON or
 * a formatting call — never carry it as a float through calculations.
 */

export function formatMoney(
  amount: number,
  currency: string,
  locale = "en-NG"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount)
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}
