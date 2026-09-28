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

type NetWorthRawData = {
  cashNow: number
  cashCurrency: string
  holdings: HoldingValuation[]
  monthKeys: string[]
  netFlowByMonth: number[]
  realEstate: Awaited<
    ReturnType<typeof manualAssetsRepo.listManualAssetsByCategory>
  >
  otherAssets: Awaited<
    ReturnType<typeof manualAssetsRepo.listManualAssetsByCategory>
  >
  liabilities: Awaited<ReturnType<typeof liabilitiesRepo.listLiabilities>>
  fxTable: FxRateTable
  priceHistories: Map<string, { price: number; fetchedAt: Date }[]>
}

const TREND_MONTHS = 6

/**
 * Fetches everything net worth needs exactly ONCE, regardless of how many
 * reporting currencies the caller wants a summary in. This replaces the
 * previous design, which fetched all of this independently inside
 * getNetWorth() every time it was called — since the dashboard always wants
 * both an NGN and a USD summary, that meant opening balance, net flow,
 * 6-month transaction history, manual assets, liabilities, FX rates, and
 * price history were each queried twice per page load for no reason: only
 * the final currency conversion differs between the two summaries, not the
 * underlying data. Also batches price history into one query instead of
 * one-per-holding (see getPriceHistoriesForSecurities).
 */
async function fetchNetWorthRawData(
  userId: string,
  holdings: HoldingValuation[],
  cashCurrency: string
): Promise<NetWorthRawData> {
  const monthKeys = trailingMonthKeys(TREND_MONTHS)
  const securityIds = holdings.map((h) => h.securityId)

  const [
    openingBalance,
    allTimeNet,
    monthlyFlows,
    realEstate,
    otherAssets,
    liabilities,
    fxTable,
    priceHistoryRows,
  ] = await Promise.all([
    getTotalOpeningBalance(userId),
    getAllTimeNetFlow(userId),
    getMonthlyTotalsRange(userId, TREND_MONTHS),
    manualAssetsRepo.listManualAssetsByCategory(userId, "real_estate"),
    manualAssetsRepo.listManualAssetsByCategory(userId, "other"),
    liabilitiesRepo.listLiabilities(userId),
    loadFxRates(),
    securitiesRepo.getPriceHistoriesForSecurities(securityIds, 60),
  ])

  const priceHistories = new Map<
    string,
    { price: number; fetchedAt: Date }[]
  >()
  for (const row of priceHistoryRows) {
    const list = priceHistories.get(row.securityId) ?? []
    list.push({ price: Number(row.price), fetchedAt: row.fetchedAt })
    priceHistories.set(row.securityId, list)
  }

  return {
    cashNow: openingBalance + allTimeNet,
    cashCurrency,
    holdings,
    monthKeys,
    netFlowByMonth: monthlyFlows.map((m) => m.income - m.expense),
    realEstate,
    otherAssets,
    liabilities,
    fxTable,
    priceHistories,
  }
}

/** Pure — all the conversion/composition/trend math, given already-fetched
 * raw data. No DB access, so computing a second (or third) reporting
 * currency from the same raw data costs nothing beyond arithmetic. */
function computeNetWorthSummary(
  raw: NetWorthRawData,
  reportingCurrency: string
): NetWorthSummary {
  const { cashNow, cashCurrency, holdings, fxTable } = raw
  const securityIds = holdings.map((h) => h.securityId)

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
    raw.realEstate,
    (a) => Number(a.value),
    (a) => a.currency,
    reportingCurrency,
    fxTable
  )
  const otherAssetsValue = sumConverted(
    raw.otherAssets,
    (a) => Number(a.value),
    (a) => a.currency,
    reportingCurrency,
    fxTable
  )
  const liabilitiesValue = sumConverted(
    raw.liabilities,
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

  // Cash at each month's end = today's cash minus every net flow that
  // happened after that month ended (walking backward from "now").
  const trend: NetWorthTrendPoint[] = []
  for (let i = 0; i < raw.monthKeys.length; i++) {
    const flowAfter = raw.netFlowByMonth
      .slice(i + 1)
      .reduce((s, v) => s + v, 0)
    const cashAtMonthEnd = cashNow - flowAfter
    const cashConverted = convertAmount(
      cashAtMonthEnd,
      cashCurrency,
      reportingCurrency,
      fxTable
    ).value

    const monthEndCutoff = monthRange(raw.monthKeys[i]).end
    const priceById = pricesAsOf(
      securityIds,
      raw.priceHistories,
      monthEndCutoff
    )
    const investmentsAtMonthEnd = investmentsValueAt(
      holdings,
      priceById,
      reportingCurrency,
      fxTable
    )

    const realEstateAtMonthEnd = sumConverted(
      raw.realEstate.filter((a) => a.createdAt < monthEndCutoff),
      (a) => Number(a.value),
      (a) => a.currency,
      reportingCurrency,
      fxTable
    )
    const otherAtMonthEnd = sumConverted(
      raw.otherAssets.filter((a) => a.createdAt < monthEndCutoff),
      (a) => Number(a.value),
      (a) => a.currency,
      reportingCurrency,
      fxTable
    )
    const liabilitiesAtMonthEnd = sumConverted(
      raw.liabilities.filter((l) => l.createdAt < monthEndCutoff),
      (l) => Number(l.balance),
      (l) => l.currency,
      reportingCurrency,
      fxTable
    )

    trend.push({
      periodMonth: raw.monthKeys[i],
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
  const changePercent =
    previous !== 0 ? (change / Math.abs(previous)) * 100 : 0

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

/**
 * Takes an already-fetched `holdings` list rather than a userId, same
 * reason portfolio.service.ts's pure functions do: `listHoldingsWithValuation`
 * hits a live market-data API per holding, so callers should fetch it once
 * (e.g. dashboard.service.ts) and pass the same array in here rather than
 * each independently re-fetching it.
 *
 * Fetches raw data ONCE (see fetchNetWorthRawData) no matter how many
 * `reportingCurrencies` are requested — computing each summary from that
 * one fetch is pure arithmetic, not additional queries.
 */
export async function getNetWorthForCurrencies(
  userId: string,
  holdings: HoldingValuation[],
  /** Currency the user's single cash account is assumed to be in — mirrors
   * dashboard.service.ts's existing assumption (cash balance = the caller's
   * base currency), not a new one introduced here. */
  cashCurrency: string,
  reportingCurrencies: string[]
): Promise<NetWorthSummary[]> {
  const raw = await fetchNetWorthRawData(userId, holdings, cashCurrency)
  return reportingCurrencies.map((currency) =>
    computeNetWorthSummary(raw, currency)
  )
}
