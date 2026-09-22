import { actual, provenanceValue } from "@/lib/provenance"
import { monthKey } from "@/lib/date"
import { getTotalOpeningBalance } from "@/server/repositories/accounts.repository"
import {
  getAllTimeNetFlow,
  getMonthlyTotals,
} from "@/server/repositories/transactions.repository"
import * as budgetsService from "@/server/services/budgets.service"
import * as goalsService from "@/server/services/goals.service"

export async function getDashboardSummary(userId: string, currency: string) {
  const now = new Date()
  const periodMonth = monthKey(now)

  const [{ income, expense }, allTimeNet, openingBalance, budget, goals] =
    await Promise.all([
      getMonthlyTotals(userId, periodMonth),
      getAllTimeNetFlow(userId),
      getTotalOpeningBalance(userId),
      budgetsService.getBudgetWithProgress(userId, now),
      goalsService.listGoalsWithProgress(userId),
    ])

  const cashBalance = openingBalance + allTimeNet

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
    totalIncome: actual(income, "transactions", currency),
    totalExpenses: actual(expense, "transactions", currency),
    netCashFlow: actual(income - expense, "transactions", currency),
    cashBalance: actual(cashBalance, "accounts+transactions", currency),
    budgetUtilization: budget
      ? actual(budget.totalPercentage, "budgets", currency)
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
