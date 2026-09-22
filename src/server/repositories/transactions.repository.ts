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

import { monthRange } from "@/lib/date"
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
