import { and, eq, gte, lt, sql } from "drizzle-orm"

import { db, schema } from "@/server/db"

/** Normalizes any date to "YYYY-MM-01", the key budgets are stored under. */
export function monthKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

function monthRange(periodMonth: string) {
  const start = new Date(`${periodMonth}T00:00:00.000Z`)
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)
  )
  return { start, end }
}

export async function getBudgetForMonth(userId: string, periodMonth: string) {
  return db.query.budgets.findFirst({
    where: and(
      eq(schema.budgets.userId, userId),
      eq(schema.budgets.periodMonth, periodMonth)
    ),
    with: {
      budgetCategories: { with: { category: true } },
    },
  })
}

export async function getOrCreateBudgetForMonth(
  userId: string,
  periodMonth: string,
  currency: string
) {
  const existing = await db.query.budgets.findFirst({
    where: and(
      eq(schema.budgets.userId, userId),
      eq(schema.budgets.periodMonth, periodMonth)
    ),
  })
  if (existing) return existing

  const [created] = await db
    .insert(schema.budgets)
    .values({ userId, periodMonth, currency })
    .returning()
  return created
}

/**
 * Replaces this budget's category limits with exactly the given set —
 * inserts new ones, updates changed amounts, and removes any category the
 * user unchecked.
 */
export async function setBudgetCategoryLimits(
  budgetId: string,
  limits: { categoryId: string; limitAmount: number }[]
) {
  const existing = await db.query.budgetCategories.findMany({
    where: eq(schema.budgetCategories.budgetId, budgetId),
  })
  const existingByCategory = new Map(existing.map((e) => [e.categoryId, e]))
  const keepCategoryIds = new Set(limits.map((l) => l.categoryId))

  const toRemove = existing.filter((e) => !keepCategoryIds.has(e.categoryId))
  const toInsert = limits.filter((l) => !existingByCategory.has(l.categoryId))
  const toUpdate = limits.filter((l) => existingByCategory.has(l.categoryId))

  await Promise.all([
    ...toRemove.map((e) =>
      db
        .delete(schema.budgetCategories)
        .where(eq(schema.budgetCategories.id, e.id))
    ),
    ...toInsert.map((l) =>
      db.insert(schema.budgetCategories).values({
        budgetId,
        categoryId: l.categoryId,
        limitAmount: l.limitAmount.toString(),
      })
    ),
    ...toUpdate.map((l) =>
      db
        .update(schema.budgetCategories)
        .set({ limitAmount: l.limitAmount.toString() })
        .where(
          eq(
            schema.budgetCategories.id,
            existingByCategory.get(l.categoryId)!.id
          )
        )
    ),
  ])
}

/** Sum of expense transactions per category within the given month. */
export async function getSpentByCategory(userId: string, periodMonth: string) {
  const { start, end } = monthRange(periodMonth)

  const rows = await db
    .select({
      categoryId: schema.transactions.categoryId,
      spent: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        eq(schema.transactions.type, "expense"),
        gte(schema.transactions.occurredAt, start),
        lt(schema.transactions.occurredAt, end),
        sql`${schema.transactions.deletedAt} is null`
      )
    )
    .groupBy(schema.transactions.categoryId)

  return new Map(rows.map((r) => [r.categoryId, Number(r.spent)]))
}
