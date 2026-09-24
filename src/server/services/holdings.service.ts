import * as holdingsRepo from "@/server/repositories/holdings.repository"
import * as securitiesRepo from "@/server/repositories/securities.repository"
import type { CreateHoldingInput } from "@/lib/validation/holdings"

export type HoldingValuation = {
  id: string
  securityId: string
  ticker: string
  name: string
  exchange: string
  assetClass: string
  sector: string | null
  country: string
  quantity: number
  averageCostBasis: number
  currency: string
  currentPrice: number | null
  priceAsOf: string | null
  priceProvenance: "current" | "estimated" | null
  currentValue: number
  costBasis: number
  gainLoss: number
  gainLossPercent: number
}

export async function listHoldingsWithValuation(
  userId: string
): Promise<HoldingValuation[]> {
  const holdings = await holdingsRepo.listHoldings(userId)
  const latestPrices = await securitiesRepo.getLatestPrices(
    holdings.map((h) => ({
      id: h.securityId,
      ticker: h.security.ticker,
      exchange: h.security.exchange,
      currency: h.currency,
    }))
  )

  return holdings.map((h) => {
    const quantity = Number(h.quantity)
    const averageCostBasis = Number(h.averageCostBasis)
    const costBasis = quantity * averageCostBasis
    const priceInfo = latestPrices.get(h.securityId)
    const currentPrice = priceInfo?.price ?? null
    const currentValue =
      currentPrice !== null ? quantity * currentPrice : costBasis
    const gainLoss = currentValue - costBasis
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

    return {
      id: h.id,
      securityId: h.securityId,
      ticker: h.security.ticker,
      name: h.security.name,
      exchange: h.security.exchange,
      assetClass: h.security.assetClass,
      sector: h.security.sector,
      country: h.security.country,
      quantity,
      averageCostBasis,
      currency: h.currency,
      currentPrice,
      priceAsOf: priceInfo?.fetchedAt.toISOString() ?? null,
      priceProvenance: priceInfo?.provenance ?? null,
      currentValue,
      costBasis,
      gainLoss,
      gainLossPercent,
    }
  })
}

export async function addHolding(userId: string, input: CreateHoldingInput) {
  const security = await securitiesRepo.getSecurity(input.securityId)
  if (!security) throw new Error("Security not found")

  return holdingsRepo.addOrMergeHolding(
    userId,
    input.securityId,
    input.quantity,
    input.purchasePrice,
    security.currency
  )
}

export async function updateHolding(
  userId: string,
  id: string,
  data: { quantity?: number; averageCostBasis?: number }
) {
  return holdingsRepo.updateHolding(userId, id, data)
}

export async function removeHolding(userId: string, id: string) {
  return holdingsRepo.removeHolding(userId, id)
}
