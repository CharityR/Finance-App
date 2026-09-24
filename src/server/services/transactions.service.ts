import { writeAudit } from "@/server/audit/log"
import { emitEvent } from "@/server/events/emit"
import { getOrCreateDefaultAccount } from "@/server/repositories/accounts.repository"
import { getCategoryById } from "@/server/repositories/categories.repository"
import * as repo from "@/server/repositories/transactions.repository"
import * as budgetsService from "@/server/services/budgets.service"
import * as insightsService from "@/server/services/insights.service"
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from "@/lib/validation/transactions"

export async function listTransactions(
  userId: string,
  filters: ListTransactionsQuery
) {
  return repo.listTransactions(userId, filters)
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  const account = await getOrCreateDefaultAccount(userId, input.currency)

  // Computed before the insert so it compares this amount against prior
  // history only, not against itself.
  const unusualCheck =
    input.type === "expense" && input.categoryId
      ? insightsService.checkUnusualAmount(
          input.amount,
          await repo.getCategoryExpenseStats(userId, input.categoryId)
        )
      : null

  const created = await repo.createTransaction({
    userId,
    accountId: account.id,
    categoryId: input.categoryId,
    amount: input.amount,
    currency: input.currency,
    type: input.type,
    description: input.description,
    occurredAt: input.occurredAt,
  })

  await writeAudit({
    userId,
    action: "transaction.created",
    entity: "transaction",
    entityId: created.id,
  })

  if (input.type === "expense" && input.categoryId) {
    const category = await getCategoryById(input.categoryId)
    const categoryName = category?.name ?? "this category"

    const overspend = await budgetsService.checkCategoryOverspend(
      userId,
      input.categoryId,
      input.occurredAt
    )
    if (overspend) {
      await emitEvent("budget.exceeded", {
        userId,
        entityId: input.categoryId,
        categoryName,
        currency: input.currency,
        ...overspend,
      })
    }

    if (unusualCheck) {
      await emitEvent("transaction.unusual_amount", {
        userId,
        entityId: created.id,
        categoryName,
        currency: input.currency,
        ...unusualCheck,
      })
    }

    const trend = await insightsService.checkCategorySpendingTrend(
      userId,
      input.categoryId,
      input.occurredAt,
      input.amount
    )
    if (trend) {
      await emitEvent("category.spending_trend", {
        userId,
        entityId: input.categoryId,
        categoryName,
        currency: input.currency,
        ...trend,
      })
    }
  }

  return created
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput
) {
  const updated = await repo.updateTransaction(userId, id, input)

  if (updated) {
    await writeAudit({
      userId,
      action: "transaction.updated",
      entity: "transaction",
      entityId: id,
    })
  }

  return updated
}

export async function deleteTransaction(userId: string, id: string) {
  const deleted = await repo.softDeleteTransaction(userId, id)

  if (deleted) {
    await writeAudit({
      userId,
      action: "transaction.deleted",
      entity: "transaction",
      entityId: id,
    })
  }

  return deleted
}
