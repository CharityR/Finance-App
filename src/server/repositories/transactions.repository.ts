import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  lte,
  sql,
} from "drizzle-orm"

import { monthRange, trailingMonthKeys } from "@/lib/date"
import { db, schema } from "@/server/db"
import type { ListTransactionsQuery } from "@/lib/validation/transactions"

function buildConditions(userId: string, filters: ListTransactionsQuery) {
  const conditions = [
    eq(schema.transactions.userId, userId),
    isNull(schema.transactions.deletedAt),
  ]
  if (filters.type) conditions.push(eq(schema.transactions.type, filters.type))
  if (filters.categoryId)
    conditions.push(eq(schema.transactions.categoryId, filters.categoryId))
  if (filters.dateFrom)
    conditions.push(gte(schema.transactions.occurredAt, filters.dateFrom))
  if (filters.dateTo)
    conditions.push(lte(schema.transactions.occurredAt, filters.dateTo))
  if (filters.search)
    conditions.push(
      ilike(schema.transactions.description, `%${filters.search}%`)
    )
  return and(...conditions)
}

function buildOrderBy(sort: ListTransactionsQuery["sort"]) {
  switch (sort) {
    case "occurredAt_asc":
      return asc(schema.transactions.occurredAt)
    case "amount_desc":
      return desc(schema.transactions.amount)
    case "amount_asc":
      return asc(schema.transactions.amount)
    case "occurredAt_desc":
    default:
      return desc(schema.transactions.occurredAt)
  }
}

export async function listTransactions(
  userId: string,
  filters: ListTransactionsQuery
) {
  const where = buildConditions(userId, filters)

  const [rows, [{ count }]] = await Promise.all([
    db.query.transactions.findMany({
      where,
      with: { category: true },
      orderBy: buildOrderBy(filters.sort),
      limit: filters.pageSize,
      offset: (filters.page - 1) * filters.pageSize,
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.transactions)
      .where(where),
  ])

  return { rows, total: count, page: filters.page, pageSize: filters.pageSize }
}

/** Same filtering/sorting as listTransactions, but no pagination — for CSV
 * export, which needs every matching row rather than one page of them. */
export async function listAllTransactionsForExport(
  userId: string,
  filters: Omit<ListTransactionsQuery, "page" | "pageSize">
) {
  const where = buildConditions(userId, filters as ListTransactionsQuery)

  return db.query.transactions.findMany({
    where,
    with: { category: true },
    orderBy: buildOrderBy(filters.sort),
  })
}

export async function getTransaction(userId: string, id: string) {
  return db.query.transactions.findFirst({
    where: and(
      eq(schema.transactions.id, id),
      eq(schema.transactions.userId, userId),
      isNull(schema.transactions.deletedAt)
    ),
    with: { category: true },
  })
}

export async function createTransaction(data: {
  userId: string
  accountId: string
  categoryId?: string | null
  amount: number
  currency: string
  type: "income" | "expense"
  description?: string
  occurredAt: Date
}) {
  const [created] = await db
    .insert(schema.transactions)
    .values({
      userId: data.userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: data.amount.toString(),
      currency: data.currency,
      type: data.type,
      description: data.description,
      occurredAt: data.occurredAt,
    })
    .returning()

  return created
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: Partial<{
    categoryId: string | null
    amount: number
    currency: string
    type: "income" | "expense"
    description: string
    occurredAt: Date
  }>
) {
  const [updated] = await db
    .update(schema.transactions)
    .set({
      ...data,
      amount: data.amount !== undefined ? data.amount.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.transactions.id, id),
        eq(schema.transactions.userId, userId),
        isNull(schema.transactions.deletedAt)
      )
    )
    .returning()

  return updated
}

export async function getMonthlyTotals(userId: string, periodMonth: string) {
  const { start, end } = monthRange(periodMonth)

  const rows = await db
    .select({
      type: schema.transactions.type,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        isNull(schema.transactions.deletedAt),
        gte(schema.transactions.occurredAt, start),
        lt(schema.transactions.occurredAt, end)
      )
    )
    .groupBy(schema.transactions.type)

  const income = Number(rows.find((r) => r.type === "income")?.total ?? 0)
  const expense = Number(rows.find((r) => r.type === "expense")?.total ?? 0)
  return { income, expense }
}

/** Income/expense totals for each of the trailing `months` calendar months
 * (oldest first, ending with the current month) — the basis for savings-rate
 * trend and category spending-average comparisons. */
export async function getMonthlyTotalsRange(userId: string, months: number) {
  const keys = trailingMonthKeys(months)
  const { start } = monthRange(keys[0])

  const rows = await db
    .select({
      periodMonth: sql<string>`to_char(date_trunc('month', ${schema.transactions.occurredAt}), 'YYYY-MM-01')`,
      type: schema.transactions.type,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        isNull(schema.transactions.deletedAt),
        gte(schema.transactions.occurredAt, start)
      )
    )
    .groupBy(sql`1`, schema.transactions.type)

  return keys.map((periodMonth) => {
    const income = Number(
      rows.find((r) => r.periodMonth === periodMonth && r.type === "income")
        ?.total ?? 0
    )
    const expense = Number(
      rows.find((r) => r.periodMonth === periodMonth && r.type === "expense")
        ?.total ?? 0
    )
    return { periodMonth, income, expense }
  })
}

/** Expense total per category for one month, joined with category name/color
 * — unlike getSpentByCategory (budgets.repository.ts) this covers every
 * category the user spent in, not just ones with a budget limit set. */
export async function getCategoryBreakdownForMonth(
  userId: string,
  periodMonth: string
) {
  const { start, end } = monthRange(periodMonth)

  return db
    .select({
      categoryId: schema.transactions.categoryId,
      categoryName: sql<string | null>`${schema.categories.name}`,
      color: sql<string | null>`${schema.categories.color}`,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .leftJoin(
      schema.categories,
      eq(schema.transactions.categoryId, schema.categories.id)
    )
    .where(
      and(
        eq(schema.transactions.userId, userId),
        eq(schema.transactions.type, "expense"),
        isNull(schema.transactions.deletedAt),
        gte(schema.transactions.occurredAt, start),
        lt(schema.transactions.occurredAt, end)
      )
    )
    .groupBy(
      schema.transactions.categoryId,
      schema.categories.name,
      schema.categories.color
    )
    .orderBy(desc(sql`sum(${schema.transactions.amount})`))
}

/** Expense total per (category, month) across the trailing `months` months —
 * the source data for per-category trend comparisons (this month vs. the
 * trailing average). */
export async function getCategoryMonthlyExpenseTotals(
  userId: string,
  months: number
) {
  const keys = trailingMonthKeys(months)
  const { start } = monthRange(keys[0])

  return db
    .select({
      categoryId: schema.transactions.categoryId,
      periodMonth: sql<string>`to_char(date_trunc('month', ${schema.transactions.occurredAt}), 'YYYY-MM-01')`,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        eq(schema.transactions.type, "expense"),
        isNull(schema.transactions.deletedAt),
        gte(schema.transactions.occurredAt, start)
      )
    )
    .groupBy(schema.transactions.categoryId, sql`2`)
}

/** Raw expense rows (category + description + amount + date) over the
 * trailing `months` months, for recurring-transaction detection — done in
 * app code (grouping by category+description+similar amount) rather than
 * SQL, since "similar amount" and "occurs in most recent months" are easier
 * to express clearly in TypeScript than in a single query. */
export async function listExpensesForRecurrenceDetection(
  userId: string,
  months: number
) {
  const keys = trailingMonthKeys(months)
  const { start } = monthRange(keys[0])

  return db.query.transactions.findMany({
    where: and(
      eq(schema.transactions.userId, userId),
      eq(schema.transactions.type, "expense"),
      isNull(schema.transactions.deletedAt),
      gte(schema.transactions.occurredAt, start)
    ),
    columns: {
      categoryId: true,
      description: true,
      amount: true,
      currency: true,
      occurredAt: true,
    },
    with: { category: { columns: { name: true } } },
  })
}

/** Average amount and count of a user's past expense transactions in one
 * category — used to flag a new transaction as unusually large relative to
 * their own history in that category. */
export async function getCategoryExpenseStats(
  userId: string,
  categoryId: string
) {
  const [row] = await db
    .select({
      avg: sql<string>`coalesce(avg(${schema.transactions.amount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        eq(schema.transactions.categoryId, categoryId),
        eq(schema.transactions.type, "expense"),
        isNull(schema.transactions.deletedAt)
      )
    )

  return { average: Number(row?.avg ?? 0), count: row?.count ?? 0 }
}

/** All-time net (income − expense), used for the running cash balance. */
export async function getAllTimeNetFlow(userId: string): Promise<number> {
  const rows = await db
    .select({
      type: schema.transactions.type,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        isNull(schema.transactions.deletedAt)
      )
    )
    .groupBy(schema.transactions.type)

  const income = Number(rows.find((r) => r.type === "income")?.total ?? 0)
  const expense = Number(rows.find((r) => r.type === "expense")?.total ?? 0)
  return income - expense
}

export async function softDeleteTransaction(userId: string, id: string) {
  const [deleted] = await db
    .update(schema.transactions)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(schema.transactions.id, id),
        eq(schema.transactions.userId, userId),
        isNull(schema.transactions.deletedAt)
      )
    )
    .returning()

  return deleted
}
