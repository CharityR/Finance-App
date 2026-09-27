import { convertAmount, type FxRateTable } from "@/lib/fx"
import type { ProvenanceValue } from "@/lib/provenance"
import * as fxRatesRepo from "@/server/repositories/fx-rates.repository"

/** Fetches every seeded rate once and builds a table with both directions
 * of each pair, so a caller converting many amounts (e.g. net-worth
 * aggregation across dozens of holdings) only hits the database once. */
export async function loadFxRates(): Promise<FxRateTable> {
  const rows = await fxRatesRepo.listAllRates()
  const rates = new Map<string, { rate: number; asOf: string }>()

  for (const row of rows) {
    const rate = Number(row.rate)
    rates.set(`${row.baseCurrency}_${row.quoteCurrency}`, {
      rate,
      asOf: row.asOf,
    })
    rates.set(`${row.quoteCurrency}_${row.baseCurrency}`, {
      rate: 1 / rate,
      asOf: row.asOf,
    })
  }

  return { rates }
}

/** Convenience one-off wrapper for call sites converting a single amount
 * that don't already have a loaded FxRateTable (e.g. a form preview). Net
 * worth aggregation should call loadFxRates()+convertAmount() directly
 * instead, to avoid a DB round trip per line item. */
export async function convertToCurrency(
  amount: number,
  from: string,
  to: string
): Promise<ProvenanceValue<number>> {
  const table = await loadFxRates()
  return convertAmount(amount, from, to, table)
}
