import { actual } from "@/lib/provenance"
import { monthKey } from "@/lib/date"
import { getTotalOpeningBalance } from "@/server/repositories/accounts.repository"
import {
  getAllTimeNetFlow,
  getMonthlyTotals,
} from "@/server/repositories/transactions.repository"
import * as budgetsService from "@/server/services/budgets.service"

export async function getDashboardSummary(userId: string, currency: string) {
  const now = new Date()
  const periodMonth = monthKey(now)

  const [{ income, expense }, allTimeNet, openingBalance, budget] =
    await Promise.all([
      getMonthlyTotals(userId, periodMonth),
      getAllTimeNetFlow(userId),
      getTotalOpeningBalance(userId),
      budgetsService.getBudgetWithProgress(userId, now),
    ])

  const cashBalance = openingBalance + allTimeNet

  return {
    totalIncome: actual(income, "transactions", currency),
    totalExpenses: actual(expense, "transactions", currency),
    netCashFlow: actual(income - expense, "transactions", currency),
    cashBalance: actual(cashBalance, "accounts+transactions", currency),
    budgetUtilization: budget
      ? actual(budget.totalPercentage, "budgets", currency)
      : null,
    hasBudget: !!budget,
  }
}
