import * as holdingsService from "@/server/services/holdings.service"
import type { HoldingValuation } from "@/server/services/holdings.service"

export type AllocationSlice = {
  label: string
  value: number
  percentage: number
}

export type PortfolioSummaryForCurrency = {
  currency: string
  totalValue: number
  totalCostBasis: number
  totalGainLoss: number
  totalGainLossPercent: number
  assetClassAllocation: AllocationSlice[]
  sectorAllocation: AllocationSlice[]
  geographicAllocation: AllocationSlice[]
  holdingCount: number
}

function toAllocation(totals: Map<string, number>, grandTotal: number) {
  return Array.from(totals.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  stock: "Stocks",
  etf: "ETFs",
  mutual_fund: "Mutual Funds",
  bond: "Bonds",
  treasury_bill: "Treasury Bills",
  reit: "REITs",
  gold: "Gold",
  other: "Other",
}

function summarizeGroup(
  currency: string,
  holdings: HoldingValuation[]
): PortfolioSummaryForCurrency {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0)
  const totalGainLoss = totalValue - totalCostBasis
  const totalGainLossPercent =
    totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0

  const byAssetClass = new Map<string, number>()
  const bySector = new Map<string, number>()
  const byCountry = new Map<string, number>()

  for (const h of holdings) {
    const assetLabel = ASSET_CLASS_LABELS[h.assetClass] ?? h.assetClass
    byAssetClass.set(
      assetLabel,
      (byAssetClass.get(assetLabel) ?? 0) + h.currentValue
    )

    const sectorLabel = h.sector ?? "Unclassified"
    bySector.set(sectorLabel, (bySector.get(sectorLabel) ?? 0) + h.currentValue)

    byCountry.set(h.country, (byCountry.get(h.country) ?? 0) + h.currentValue)
  }

  return {
    currency,
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    assetClassAllocation: toAllocation(byAssetClass, totalValue),
    sectorAllocation: toAllocation(bySector, totalValue),
    geographicAllocation: toAllocation(byCountry, totalValue),
    holdingCount: holdings.length,
  }
}

/**
 * Returns one summary per currency rather than a single blended total —
 * summing NGN and USD holdings into one number would be meaningless (and
 * wrong) without an FX conversion step, which isn't built until Phase 8.
 * Sorted so the currency with the most holdings appears first.
 */
export async function getPortfolioSummary(
  userId: string
): Promise<PortfolioSummaryForCurrency[]> {
  const holdings = await holdingsService.listHoldingsWithValuation(userId)

  const byCurrency = new Map<string, HoldingValuation[]>()
  for (const h of holdings) {
    if (!byCurrency.has(h.currency)) byCurrency.set(h.currency, [])
    byCurrency.get(h.currency)!.push(h)
  }

  return Array.from(byCurrency.entries())
    .map(([currency, group]) => summarizeGroup(currency, group))
    .sort((a, b) => b.holdingCount - a.holdingCount)
}

export type NetWorthHolding = {
  id: string
  ticker: string
  name: string
  quantity: number
  currentValue: number
  gainLoss: number
  gainLossPercent: number
}

export type NetWorthSector = {
  sector: string
  value: number
  percentage: number // share of the country's value
  holdings: NetWorthHolding[]
}

export type NetWorthCountry = {
  country: string
  value: number
  percentage: number // share of the currency's total value
  sectors: NetWorthSector[]
}

export type NetWorthBreakdown = {
  currency: string
  totalValue: number
  countries: NetWorthCountry[]
}

/**
 * The same holdings, grouped for the drill-down explorer (total -> country
 * -> sector -> holdings) rather than the flat single-level allocations
 * above — kept separate since the two views serve different UI needs
 * (independent donut charts vs. a click-to-drill treemap).
 */
export async function getNetWorthBreakdown(
  userId: string
): Promise<NetWorthBreakdown[]> {
  const holdings = await holdingsService.listHoldingsWithValuation(userId)

  const byCurrency = new Map<string, HoldingValuation[]>()
  for (const h of holdings) {
    if (!byCurrency.has(h.currency)) byCurrency.set(h.currency, [])
    byCurrency.get(h.currency)!.push(h)
  }

  return Array.from(byCurrency.entries())
    .map(([currency, group]) => {
      const totalValue = group.reduce((sum, h) => sum + h.currentValue, 0)

      const byCountry = new Map<string, HoldingValuation[]>()
      for (const h of group) {
        if (!byCountry.has(h.country)) byCountry.set(h.country, [])
        byCountry.get(h.country)!.push(h)
      }

      const countries: NetWorthCountry[] = Array.from(byCountry.entries()).map(
        ([country, countryHoldings]) => {
          const countryValue = countryHoldings.reduce(
            (sum, h) => sum + h.currentValue,
            0
          )

          const bySector = new Map<string, HoldingValuation[]>()
          for (const h of countryHoldings) {
            const sector = h.sector ?? "Unclassified"
            if (!bySector.has(sector)) bySector.set(sector, [])
            bySector.get(sector)!.push(h)
          }

          const sectors: NetWorthSector[] = Array.from(bySector.entries())
            .map(([sector, sectorHoldings]) => {
              const sectorValue = sectorHoldings.reduce(
                (sum, h) => sum + h.currentValue,
                0
              )
              return {
                sector,
                value: sectorValue,
                percentage:
                  countryValue > 0 ? (sectorValue / countryValue) * 100 : 0,
                holdings: sectorHoldings
                  .map((h) => ({
                    id: h.id,
                    ticker: h.ticker,
                    name: h.name,
                    quantity: h.quantity,
                    currentValue: h.currentValue,
                    gainLoss: h.gainLoss,
                    gainLossPercent: h.gainLossPercent,
                  }))
                  .sort((a, b) => b.currentValue - a.currentValue),
              }
            })
            .sort((a, b) => b.value - a.value)

          return {
            country,
            value: countryValue,
            percentage: totalValue > 0 ? (countryValue / totalValue) * 100 : 0,
            sectors,
          }
        }
      )

      return {
        currency,
        totalValue,
        countries: countries.sort((a, b) => b.value - a.value),
      }
    })
    .sort((a, b) => b.totalValue - a.totalValue)
}
