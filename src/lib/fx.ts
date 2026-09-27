import { provenanceValue, type ProvenanceValue } from "@/lib/provenance"

/**
 * Pure conversion math — no DB import, so this is safe to import from a
 * test or a client component. Loading the rate table from the database
 * lives in src/server/services/fx.service.ts instead.
 */
export type FxRateTable = {
  /** rate.value multiplied by an amount in `pair.base` gives the amount in
   * `pair.quote` — keyed "BASE_QUOTE", with both directions of every seeded
   * row present so lookups never need to know which way a rate was stored. */
  rates: Map<string, { rate: number; asOf: string }>
}

/**
 * Converts a single amount using an already-loaded rate table. Pure/
 * synchronous, same reason portfolio.service.ts's summarize functions take
 * an already-fetched list rather than a userId — share one table load across
 * many conversions instead of each one re-fetching.
 *
 * Same-currency amounts are tagged "actual" (no conversion happened).
 * Cross-currency amounts are tagged "estimated" since the rate is a static,
 * seeded value, not a live market feed — throws if no rate is configured for
 * the pair rather than silently returning the unconverted amount, so a
 * missing rate is loud, not a quietly wrong number.
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  table: FxRateTable
): ProvenanceValue<number> {
  if (from === to) {
    return provenanceValue(amount, "actual", "database", { currency: to })
  }

  const entry = table.rates.get(`${from}_${to}`)
  if (!entry) {
    throw new Error(
      `No FX rate configured for ${from} -> ${to}. Seed one in fx_rates.`
    )
  }

  return provenanceValue(amount * entry.rate, "estimated", "fx_rates", {
    currency: to,
    asOf: entry.asOf,
  })
}
