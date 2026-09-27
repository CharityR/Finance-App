import { actual, provenanceValue } from "@/lib/provenance"
import { monthKey } from "@/lib/date"
import { computeWealthInsights } from "@/lib/wealth-insights"
import { getTotalOpeningBalance } from "@/server/repositories/accounts.repository"
import {
  getAllTimeNetFlow,
  getMonthlyTotals,
} from "@/server/repositories/transactions.repository"
import * as budgetsService from "@/server/services/budgets.service"
import * as goalsService from "@/server/services/goals.service"
import * as holdingsService from "@/server/services/holdings.service"
import * as netWorthService from "@/server/services/net-worth.service"
import * as portfolioService from "@/server/services/portfolio.service"

const REPORTING_CURRENCIES = ["NGN", "USD"]

/**
 * Everything the dashboard/"wealth command center" page needs, fetched once
 * so nothing on the page re-derives the same figures independently. This
 * matters even more here than it did for the Investments page: holdings
 * valuation hits a live, rate-limited, un-timed-out market-data API per
 * holding, so `listHoldingsWithValuation` is fetched exactly ONCE below and
 * shared with both the portfolio summary and every getNetWorth() call
 * (originally one per reporting currency each re-fetched it independently,
 * which multiplied external-API calls and, under load, stalled the whole
 * page for minutes).
 */
export async function getWealthOverview(userId: string, cashCurrency: string) {
  const now = new Date()
  const periodMonth = monthKey(now)

  const [
    { income, expense },
    allTimeNet,
    openingBalance,
    budget,
    goals,
    holdings,
  ] = await Promise.all([
    getMonthlyTotals(userId, periodMonth),
    getAllTimeNetFlow(userId),
    getTotalOpeningBalance(userId),
    budgetsService.getBudgetWithProgress(userId, now),
    goalsService.listGoalsWithProgress(userId),
    holdingsService.listHoldingsWithValuation(userId),
  ])

  const portfolioByCurrency = portfolioService.summarizePortfolioByCurrency(
    holdings
  )
  const netWorthSummaries = await Promise.all(
    REPORTING_CURRENCIES.map((currency) =>
      netWorthService.getNetWorth(userId, holdings, cashCurrency, currency)
    )
  )

  const cashBalance = openingBalance + allTimeNet
  const netCashFlow = income - expense

  const totalGoalTarget = goals.reduce(
    (sum, g) => sum + Number(g.targetAmount),
    0
  )
  const totalGoalCurrent = goals.reduce(
    (sum, g) => sum + Number(g.currentAmount),
    0
  )
  const goalsOffTrack = goals.filter(
    (g) => g.status !== "completed" && !g.progress.isOnTrack
  ).length

  const primaryNetWorth =
    netWorthSummaries.find((s) => s.reportingCurrency === cashCurrency) ??
    netWorthSummaries[0]
  const primaryPortfolio = portfolioByCurrency[0] ?? null

  const insights = computeWealthInsights({
    reportingCurrency: cashCurrency,
    investmentAllocation: primaryPortfolio?.assetClassAllocation ?? [],
    goals: goals.map((g) => ({ name: g.name, progress: g.progress })),
    netWorthChangePercent: primaryNetWorth.monthOverMonthChangePercent.value,
    netCashFlow,
    monthlyIncome: income,
  })

  return {
    netWorthSummaries,
    investmentsSummary: primaryPortfolio,
    goals,
    insights,
    cashFlow: {
      totalIncome: actual(income, "transactions", cashCurrency),
      totalExpenses: actual(expense, "transactions", cashCurrency),
      netCashFlow: actual(netCashFlow, "transactions", cashCurrency),
      cashBalance: actual(cashBalance, "accounts+transactions", cashCurrency),
    },
    budgetUtilization: budget
      ? actual(budget.totalPercentage, "budgets", cashCurrency)
      : null,
    hasBudget: !!budget,
    goalsSummary:
      goals.length > 0
        ? {
            count: goals.length,
            offTrackCount: goalsOffTrack,
            overallPercentage: provenanceValue(
              totalGoalTarget > 0
                ? (totalGoalCurrent / totalGoalTarget) * 100
                : 0,
              "estimated",
              "goals"
            ),
          }
        : null,
  }
}
