import { monthKey, monthRange, trailingMonthKeys } from "@/lib/date"
import { convertAmount, type FxRateTable } from "@/lib/fx"
import {
  buildNetWorthComposition,
  type NetWorthComposition,
} from "@/lib/net-worth"
import { provenanceValue, type ProvenanceValue } from "@/lib/provenance"
import { getTotalOpeningBalance } from "@/server/repositories/accounts.repository"
import * as liabilitiesRepo from "@/server/repositories/liabilities.repository"
import * as manualAssetsRepo from "@/server/repositories/manual-assets.repository"
import * as securitiesRepo from "@/server/repositories/securities.repository"
import {
  getAllTimeNetFlow,
  getMonthlyTotalsRange,
} from "@/server/repositories/transactions.repository"
import { loadFxRates } from "@/server/services/fx.service"
import type { HoldingValuation } from "@/server/services/holdings.service"

export type { NetWorthCategory, NetWorthComposition } from "@/lib/net-worth"

export type NetWorthTrendPoint = { periodMonth: string; total: number }

export type NetWorthSummary = {
  reportingCurrency: string
  total: ProvenanceValue<number>
  monthOverMonthChange: ProvenanceValue<number>
  monthOverMonthChangePercent: ProvenanceValue<number>
  composition: NetWorthComposition[]
  /** Monthly points, oldest first, up to 6 months — the UI slices this for
   * the 1M/3M/6M toggle. 1Y/5Y/ALL aren't offered: seed price history only
   * spans ~10 days per security, so a longer "trend" would mostly be a flat
   * line repeating the earliest known price rather than real movement. */
  trend: NetWorthTrendPoint[]
}

function sumConverted<T>(
  items: T[],
  amount: (item: T) => number,
  currency: (item: T) => string,
  reportingCurrency: string,
  table: FxRateTable
): number {
  return items.reduce(
    (sum, item) =>
      sum +
      convertAmount(amount(item), currency(item), reportingCurrency, table)
        .value,
    0
  )
}

/** Fetches each security's price history ONCE (not once per month in the
 * trend loop below — that was the original version's bug: 6 months x N
 * securities x 2 reporting currencies worth of redundant DB round trips per
 * dashboard load). Returns snapshots sorted desc by fetchedAt per security,
 * so the trend loop can pick the nearest one at or before each month's
 * cutoff with a pure in-memory lookup instead of another query. */
async function loadPriceHistories(
  securityIds: string[]
): Promise<Map<string, { price: number; fetchedAt: Date }[]>> {
  const histories = await Promise.all(
    securityIds.map((id) => securitiesRepo.getPriceHistory(id, 60))
  )
  const map = new Map<string, { price: number; fetchedAt: Date }[]>()
  securityIds.forEach((id, i) => {
    map.set(
      id,
      histories[i].map((p) => ({
        price: Number(p.price),
        fetchedAt: p.fetchedAt,
      }))
    )
  })
  return map
}

/** Nearest snapshot at or before `asOf` per security, falling back to the
 * earliest snapshot on hand when every snapshot postdates `asOf` (seed data
 * is short, so an old "as of" date otherwise has nothing to match) — never
 * fabricates a price, only picks the closest real one. Pure/synchronous:
 * reads from the already-fetched histories map, no DB access. */
function pricesAsOf(
  securityIds: string[],
  histories: Map<string, { price: number; fetchedAt: Date }[]>,
  asOf: Date
): Map<string, number> {
  const map = new Map<string, number>()
  for (const id of securityIds) {
    const history = histories.get(id) ?? [] // sorted desc by fetchedAt
    const match =
      history.find((p) => p.fetchedAt <= asOf) ?? history[history.length - 1]
    if (match) map.set(id, match.price)
  }
  return map
}

function investmentsValueAt(
  holdings: HoldingValuation[],
  priceById: Map<string, number>,
  reportingCurrency: string,
  table: FxRateTable
): number {
  return holdings.reduce((sum, h) => {
    const price = priceById.get(h.securityId) ?? h.currentPrice ?? 0
    const value = h.quantity * price
    return (
      sum + convertAmount(value, h.currency, reportingCurrency, table).value
    )
  }, 0)
}

/**
 * Takes an already-fetched `holdings` list rather than a userId, for the
 * same reason portfolio.service.ts's pure functions do: this is normally
 * called twice per dashboard load (once per reporting currency), and
 * `listHoldingsWithValuation` hits a live, rate-limited, un-timed-out
 * market-data API per holding — fetching it independently in each call
 * (it originally did) multiplies that external-API cost and, under load,
 * can stall the whole page for minutes. Callers should fetch holdings once
 * (e.g. dashboard.service.ts) and pass the same array into every call.
 */
export async function getNetWorth(
  userId: string,
  holdings: HoldingValuation[],
  /** Currency the user's single cash account is assumed to be in — mirrors
   * dashboard.service.ts's existing assumption (cash balance = the caller's
   * base currency), not a new one introduced here. */
  cashCurrency: string,
  reportingCurrency: string
): Promise<NetWorthSummary> {
  const months = 6
  const monthKeys = trailingMonthKeys(months)
  const securityIds = holdings.map((h) => h.securityId)

  const [
    openingBalance,
    allTimeNet,
    monthlyFlows,
    realEstate,
    otherAssets,
    liabilities,
    fxTable,
    priceHistories,
  ] = await Promise.all([
    getTotalOpeningBalance(userId),
    getAllTimeNetFlow(userId),
    getMonthlyTotalsRange(userId, months),
    manualAssetsRepo.listManualAssetsByCategory(userId, "real_estate"),
    manualAssetsRepo.listManualAssetsByCategory(userId, "other"),
    liabilitiesRepo.listLiabilities(userId),
    loadFxRates(),
    loadPriceHistories(securityIds),
  ])

  const cashNow = openingBalance + allTimeNet

  // --- current totals -------------------------------------------------
  const cashValue = convertAmount(
    cashNow,
    cashCurrency,
    reportingCurrency,
    fxTable
  ).value
  const investmentsValue = sumConverted(
    holdings,
    (h) => h.currentValue,
    (h) => h.currency,
    reportingCurrency,
    fxTable
  )
  const realEstateValue = sumConverted(
    realEstate,
    (a) => Number(a.value),
    (a) => a.currency,
    reportingCurrency,
    fxTable
  )
  const otherAssetsValue = sumConverted(
    otherAssets,
    (a) => Number(a.value),
    (a) => a.currency,
    reportingCurrency,
    fxTable
  )
  const liabilitiesValue = sumConverted(
    liabilities,
    (l) => Number(l.balance),
    (l) => l.currency,
    reportingCurrency,
    fxTable
  )

  const { netWorth, composition } = buildNetWorthComposition({
    cash: cashValue,
    investments: investmentsValue,
    realEstate: realEstateValue,
    otherAssets: otherAssetsValue,
    liabilities: liabilitiesValue,
  })

  // --- monthly trend ----------------------------------------------------
  // Cash at each month's end = today's cash minus every net flow that
  // happened after that month ended (walking backward from "now").
  const netFlowByMonth = monthlyFlows.map((m) => m.income - m.expense)

  const trend: NetWorthTrendPoint[] = []
  for (let i = 0; i < monthKeys.length; i++) {
    const flowAfter = netFlowByMonth.slice(i + 1).reduce((s, v) => s + v, 0)
    const cashAtMonthEnd = cashNow - flowAfter
    const cashConverted = convertAmount(
      cashAtMonthEnd,
      cashCurrency,
      reportingCurrency,
      fxTable
    ).value

    const monthEndCutoff = monthRange(monthKeys[i]).end
    const priceById = pricesAsOf(securityIds, priceHistories, monthEndCutoff)
    const investmentsAtMonthEnd = investmentsValueAt(
      holdings,
      priceById,
      reportingCurrency,
      fxTable
    )

    const realEstateAtMonthEnd = sumConverted(
      realEstate.filter((a) => a.createdAt < monthEndCutoff),
      (a) => Number(a.value),
      (a) => a.currency,
      reportingCurrency,
      fxTable
    )
    const otherAtMonthEnd = sumConverted(
      otherAssets.filter((a) => a.createdAt < monthEndCutoff),
      (a) => Number(a.value),
      (a) => a.currency,
      reportingCurrency,
      fxTable
    )
    const liabilitiesAtMonthEnd = sumConverted(
      liabilities.filter((l) => l.createdAt < monthEndCutoff),
      (l) => Number(l.balance),
      (l) => l.currency,
      reportingCurrency,
      fxTable
    )

    trend.push({
      periodMonth: monthKeys[i],
      total:
        cashConverted +
        investmentsAtMonthEnd +
        realEstateAtMonthEnd +
        otherAtMonthEnd -
        liabilitiesAtMonthEnd,
    })
  }

  const thisMonthKey = monthKey(new Date())
  trend[trend.length - 1] = { periodMonth: thisMonthKey, total: netWorth }

  const previous = trend[trend.length - 2]?.total ?? netWorth
  const change = netWorth - previous
  const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0

  return {
    reportingCurrency,
    total: provenanceValue(netWorth, "estimated", "net_worth_aggregation", {
      currency: reportingCurrency,
    }),
    monthOverMonthChange: provenanceValue(
      change,
      "estimated",
      "net_worth_aggregation",
      { currency: reportingCurrency }
    ),
    monthOverMonthChangePercent: provenanceValue(
      changePercent,
      "estimated",
      "net_worth_aggregation"
    ),
    composition,
    trend,
  }
}
