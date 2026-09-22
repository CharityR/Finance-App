import * as repo from "@/server/repositories/budgets.repository"

export type BudgetCategoryProgress = {
  categoryId: string
  categoryName: string
  limitAmount: number
  spent: number
  remaining: number
  percentage: number
  isOverspent: boolean
}

export type BudgetProgress = {
  periodMonth: string
  currency: string
  categories: BudgetCategoryProgress[]
  totalLimit: number
  totalSpent: number
  totalRemaining: number
  totalPercentage: number
} | null

export async function getBudgetWithProgress(
  userId: string,
  month: Date = new Date()
): Promise<BudgetProgress> {
  const periodMonth = repo.monthKey(month)
  const budget = await repo.getBudgetForMonth(userId, periodMonth)
  if (!budget) return null

  const spentByCategory = await repo.getSpentByCategory(userId, periodMonth)

  const categories: BudgetCategoryProgress[] = budget.budgetCategories.map(
    (bc) => {
      const limitAmount = Number(bc.limitAmount)
      const spent = spentByCategory.get(bc.categoryId) ?? 0
      const percentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0
      return {
        categoryId: bc.categoryId,
        categoryName: bc.category.name,
        limitAmount,
        spent,
        remaining: limitAmount - spent,
        percentage,
        isOverspent: spent > limitAmount,
      }
    }
  )

  const totalLimit = categories.reduce((sum, c) => sum + c.limitAmount, 0)
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0)

  return {
    periodMonth,
    currency: budget.currency,
    categories,
    totalLimit,
    totalSpent,
    totalRemaining: totalLimit - totalSpent,
    totalPercentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
  }
}

export async function saveBudgetForMonth(
  userId: string,
  month: Date,
  currency: string,
  limits: { categoryId: string; limitAmount: number }[]
) {
  const periodMonth = repo.monthKey(month)
  const budget = await repo.getOrCreateBudgetForMonth(
    userId,
    periodMonth,
    currency
  )
  await repo.setBudgetCategoryLimits(budget.id, limits)
  return getBudgetWithProgress(userId, month)
}

/**
 * Called right after an expense transaction is created (see
 * transactions.service.ts) — checks whether it just pushed that category
 * over its budget for the current month, so the check happens once, at the
 * moment of the crossing transaction, rather than being recomputed as a
 * side effect of every later page view.
 */
export async function checkCategoryOverspend(
  userId: string,
  categoryId: string,
  occurredAt: Date
) {
  const periodMonth = repo.monthKey(occurredAt)
  const budget = await repo.getBudgetForMonth(userId, periodMonth)
  if (!budget) return null

  const budgetCategory = budget.budgetCategories.find(
    (bc) => bc.categoryId === categoryId
  )
  if (!budgetCategory) return null

  const spentByCategory = await repo.getSpentByCategory(userId, periodMonth)
  const spent = spentByCategory.get(categoryId) ?? 0
  const limitAmount = Number(budgetCategory.limitAmount)

  if (spent > limitAmount) {
    return { categoryId, spent, limitAmount, periodMonth }
  }
  return null
}
