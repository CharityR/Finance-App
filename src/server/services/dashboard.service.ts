import { actual, provenanceValue } from "@/lib/provenance"
import { monthKey } from "@/lib/date"
import { withTimeoutOrThrow } from "@/lib/with-timeout"
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
 * Each dashboard section below is fetched and timed out independently —
 * this file used to have one getWealthOverview() that awaited everything
 * in a single Promise.all, so one slow piece (in practice, usually the
 * live market-data lookups or the net-worth aggregation) made the ENTIRE
 * page hang or time out with nothing rendered at all. Splitting it means a
 * slow/failing section shows its own "couldn't load, retry" state while
 * the rest of the page — and the rest of the app — stays usable.
 *
 * 10s per section: generous for a healthy request, short enough that a
 * section fails on its own well before Vercel's own function timeout would
 * otherwise kill the whole page.
 */
const SECTION_TIMEOUT_MS = 10_000

export type NetWorthSection = {
  netWorthSummaries: netWorthService.NetWorthSummary[]
  investmentsSummary: portfolioService.PortfolioSummaryForCurrency | null
}

/** Holdings valuation (which hits a live, per-holding market-data API) is
 * fetched exactly once here and shared between the portfolio summary and
 * every reporting-currency net-worth calculation — see the longer comment
 * this used to carry in getWealthOverview() for why that matters: fetching
 * it independently per call multiplies external-API cost and, under load,
 * can stall for minutes. */
export async function getNetWorthSection(
  userId: string,
  cashCurrency: string
): Promise<NetWorthSection> {
  return withTimeoutOrThrow(
    (async () => {
      const holdings = await holdingsService.listHoldingsWithValuation(userId)
      const portfolioByCurrency =
        portfolioService.summarizePortfolioByCurrency(holdings)
      const netWorthSummaries = await netWorthService.getNetWorthForCurrencies(
        userId,
        holdings,
        cashCurrency,
        REPORTING_CURRENCIES
      )
      return {
        netWorthSummaries,
        investmentsSummary: portfolioByCurrency[0] ?? null,
      }
    })(),
    SECTION_TIMEOUT_MS,
    "Net worth"
  )
}

export type GoalsAndBudgetSection = {
  goals: Awaited<ReturnType<typeof goalsService.listGoalsWithProgress>>
  goalsSummary: {
    count: number
    offTrackCount: number
    overallPercentage: ReturnType<typeof provenanceValue<number>>
  } | null
  hasBudget: boolean
  budgetUtilization: ReturnType<typeof actual<number>> | null
}

export async function getGoalsAndBudgetSection(
  userId: string,
  cashCurrency: string
): Promise<GoalsAndBudgetSection> {
  return withTimeoutOrThrow(
    (async () => {
      const [goals, budget] = await Promise.all([
        goalsService.listGoalsWithProgress(userId),
        budgetsService.getBudgetWithProgress(userId, new Date()),
      ])

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

      return {
        goals,
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
        hasBudget: !!budget,
        budgetUtilization: budget
          ? actual(budget.totalPercentage, "budgets", cashCurrency)
          : null,
      }
    })(),
    SECTION_TIMEOUT_MS,
    "Goals & budget"
  )
}

export type CashFlowSection = {
  totalIncome: ReturnType<typeof actual<number>>
  totalExpenses: ReturnType<typeof actual<number>>
  netCashFlow: ReturnType<typeof actual<number>>
  cashBalance: ReturnType<typeof actual<number>>
}

export async function getCashFlowSection(
  userId: string,
  cashCurrency: string
): Promise<CashFlowSection> {
  return withTimeoutOrThrow(
    (async () => {
      const periodMonth = monthKey(new Date())
      const [{ income, expense }, allTimeNet, openingBalance] =
        await Promise.all([
          getMonthlyTotals(userId, periodMonth),
          getAllTimeNetFlow(userId),
          getTotalOpeningBalance(userId),
        ])

      return {
        totalIncome: actual(income, "transactions", cashCurrency),
        totalExpenses: actual(expense, "transactions", cashCurrency),
        netCashFlow: actual(income - expense, "transactions", cashCurrency),
        cashBalance: actual(
          openingBalance + allTimeNet,
          "accounts+transactions",
          cashCurrency
        ),
      }
    })(),
    SECTION_TIMEOUT_MS,
    "Cash flow"
  )
}
