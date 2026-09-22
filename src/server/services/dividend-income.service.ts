import * as holdingsRepo from "@/server/repositories/holdings.repository"
import * as securitiesRepo from "@/server/repositories/securities.repository"

export type DividendIncomeBreakdown = {
  securityId: string
  ticker: string
  annualPerShare: number
  quantity: number
  estimatedAnnualIncome: number
}

export type DividendIncomeByCurrency = {
  currency: string
  breakdown: DividendIncomeBreakdown[]
  totalEstimatedAnnualIncome: number
}

/**
 * Estimated annual dividend income = quantity held × the sum of all seeded
 * dividend_event payments per share for that security. The mock fixtures
 * seed exactly one past + one upcoming semi-annual payment per payer, so
 * this sum already represents a full year — a real adapter (Phase 6+) would
 * instead sum trailing-twelve-months actual payments.
 *
 * Grouped by currency for the same reason portfolio.service.ts is: summing
 * NGN and USD dividend income into one number would be meaningless without
 * an FX conversion step.
 */
export async function getEstimatedAnnualIncome(
  userId: string
): Promise<DividendIncomeByCurrency[]> {
  const holdings = await holdingsRepo.listHoldings(userId)

  const byCurrency = new Map<string, DividendIncomeBreakdown[]>()
  for (const holding of holdings) {
    const events = await securitiesRepo.getDividendHistory(holding.securityId)
    if (events.length === 0) continue

    const annualPerShare = events.reduce(
      (sum, e) => sum + Number(e.amountPerShare),
      0
    )
    const quantity = Number(holding.quantity)

    if (!byCurrency.has(holding.currency)) byCurrency.set(holding.currency, [])
    byCurrency.get(holding.currency)!.push({
      securityId: holding.securityId,
      ticker: holding.security.ticker,
      annualPerShare,
      quantity,
      estimatedAnnualIncome: annualPerShare * quantity,
    })
  }

  return Array.from(byCurrency.entries()).map(([currency, breakdown]) => ({
    currency,
    breakdown,
    totalEstimatedAnnualIncome: breakdown.reduce(
      (sum, b) => sum + b.estimatedAnnualIncome,
      0
    ),
  }))
}
