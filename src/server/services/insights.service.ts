import { monthKey } from "@/lib/date"
import * as transactionsRepo from "@/server/repositories/transactions.repository"

export type SavingsRatePoint = {
  periodMonth: string
  income: number
  expense: number
  savingsRate: number
}

/** Savings rate = (income - expense) / income, per month. 0 when there was
 * no income that month (avoids a meaningless divide-by-zero/negative-only
 * reading). */
export async function getSavingsRateTrend(
  userId: string,
  months = 6
): Promise<SavingsRatePoint[]> {
  const rows = await transactionsRepo.getMonthlyTotalsRange(userId, months)
  return rows.map(({ periodMonth, income, expense }) => ({
    periodMonth,
    income,
    expense,
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
  }))
}

export type CategoryBreakdownItem = {
  categoryId: string | null
  categoryName: string
  color: string
  total: number
  percentage: number
}

/** Every expense category's share of the given month's spending — unlike
 * the Budgets page, this includes categories with no budget limit set. */
export async function getCategoryBreakdown(
  userId: string,
  periodMonth: string = monthKey(new Date())
): Promise<CategoryBreakdownItem[]> {
  const rows = await transactionsRepo.getCategoryBreakdownForMonth(
    userId,
    periodMonth
  )
  const totalSpent = rows.reduce((sum, r) => sum + Number(r.total), 0)

  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? "Uncategorized",
    color: r.color ?? "#64748b",
    total: Number(r.total),
    percentage: totalSpent > 0 ? (Number(r.total) / totalSpent) * 100 : 0,
  }))
}

export type RecurringTransaction = {
  categoryId: string | null
  categoryName: string
  description: string
  averageAmount: number
  currency: string
  occurrences: number
  lastOccurredAt: string
}

const RECURRING_MIN_OCCURRENCES = 3
const RECURRING_MIN_DISTINCT_MONTHS = 3
const RECURRING_AMOUNT_TOLERANCE = 0.15

/**
 * Groups expense transactions by (category, normalized description) and
 * flags a group as "recurring" when it shows up in at least 3 distinct
 * months with a consistent amount (within 15% of the median) — a simple,
 * explainable heuristic rather than a statistical/ML model, since the goal
 * is surfacing obvious subscriptions/bills, not perfect recall.
 */
export async function getRecurringTransactions(
  userId: string,
  months = 4
): Promise<RecurringTransaction[]> {
  const rows = await transactionsRepo.listExpensesForRecurrenceDetection(
    userId,
    months
  )

  const groups = new Map<string, typeof rows>()
  for (const row of rows) {
    const description = row.description?.trim().toLowerCase()
    if (!description) continue
    const key = `${row.categoryId ?? "none"}::${description}`
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }

  const results: RecurringTransaction[] = []
  for (const group of groups.values()) {
    if (group.length < RECURRING_MIN_OCCURRENCES) continue

    const amounts = group.map((g) => Number(g.amount)).sort((a, b) => a - b)
    const median = amounts[Math.floor(amounts.length / 2)]
    const isConsistent = amounts.every(
      (a) => Math.abs(a - median) / median <= RECURRING_AMOUNT_TOLERANCE
    )
    if (!isConsistent) continue

    const distinctMonths = new Set(
      group.map((g) => monthKey(new Date(g.occurredAt)))
    )
    if (distinctMonths.size < RECURRING_MIN_DISTINCT_MONTHS) continue

    const sorted = [...group].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    const latest = sorted[0]

    results.push({
      categoryId: latest.categoryId,
      categoryName: latest.category?.name ?? "Uncategorized",
      description: latest.description!.trim(),
      averageAmount: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
      currency: latest.currency,
      occurrences: group.length,
      lastOccurredAt:
        latest.occurredAt instanceof Date
          ? latest.occurredAt.toISOString()
          : latest.occurredAt,
    })
  }

  return results.sort((a, b) => b.averageAmount - a.averageAmount)
}

export type CategoryTrend = {
  average: number
  current: number
  percentAbove: number
}

const TREND_THRESHOLD_MULTIPLIER = 1.3
const TREND_MIN_PRIOR_MONTHS = 2

/**
 * Compares this month's spend in a category to the trailing average,
 * returning a result only the first time the category crosses 30% above
 * average this month (the caller passes the amount just added so it can
 * tell "already over, don't re-notify" from "just crossed the line").
 */
export async function checkCategorySpendingTrend(
  userId: string,
  categoryId: string,
  occurredAt: Date,
  justAddedAmount: number
): Promise<CategoryTrend | null> {
  const rows = await transactionsRepo.getCategoryMonthlyExpenseTotals(userId, 4)
  const currentMonth = monthKey(occurredAt)
  const forCategory = rows.filter((r) => r.categoryId === categoryId)

  const currentTotal = Number(
    forCategory.find((r) => r.periodMonth === currentMonth)?.total ?? 0
  )
  const priorMonths = forCategory.filter((r) => r.periodMonth !== currentMonth)
  if (priorMonths.length < TREND_MIN_PRIOR_MONTHS) return null

  const average =
    priorMonths.reduce((sum, r) => sum + Number(r.total), 0) /
    priorMonths.length
  if (average <= 0) return null

  const threshold = average * TREND_THRESHOLD_MULTIPLIER
  const previousTotal = currentTotal - justAddedAmount
  const wasAlreadyOver = previousTotal > threshold
  const isNowOver = currentTotal > threshold
  if (wasAlreadyOver || !isNowOver) return null

  return {
    average,
    current: currentTotal,
    percentAbove: ((currentTotal - average) / average) * 100,
  }
}

export type UnusualTransaction = {
  average: number
  amount: number
  multiple: number
}

const UNUSUAL_MIN_HISTORY = 5
const UNUSUAL_MULTIPLIER_THRESHOLD = 2.5

/** Flags a transaction amount as unusually large for the user's own history
 * in that category (not a fixed threshold, since "large" is relative to
 * spending habits) — call with stats computed BEFORE inserting the new
 * transaction, so it isn't comparing the outlier against itself. */
export function checkUnusualAmount(
  amount: number,
  stats: { average: number; count: number }
): UnusualTransaction | null {
  if (stats.count < UNUSUAL_MIN_HISTORY || stats.average <= 0) return null
  const multiple = amount / stats.average
  if (multiple < UNUSUAL_MULTIPLIER_THRESHOLD) return null
  return { average: stats.average, amount, multiple }
}
