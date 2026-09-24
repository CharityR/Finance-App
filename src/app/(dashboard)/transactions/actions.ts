"use server"

import { revalidatePath } from "next/cache"

import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validation/categories"
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "@/lib/validation/transactions"
import * as categoriesService from "@/server/services/categories.service"
import * as transactionsService from "@/server/services/transactions.service"
import { createClient } from "@/server/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

export async function createTransactionAction(input: CreateTransactionInput) {
  const user = await requireUser()
  const parsed = createTransactionSchema.parse(input)
  const created = await transactionsService.createTransaction(user.id, parsed)
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  return created
}

export async function updateTransactionAction(
  id: string,
  input: UpdateTransactionInput
) {
  const user = await requireUser()
  const parsed = updateTransactionSchema.parse(input)
  const updated = await transactionsService.updateTransaction(
    user.id,
    id,
    parsed
  )
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  return updated
}

export async function deleteTransactionAction(id: string) {
  const user = await requireUser()
  const deleted = await transactionsService.deleteTransaction(user.id, id)
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  return deleted
}

function revalidateCategoryConsumers() {
  revalidatePath("/transactions")
  revalidatePath("/budgets")
}

export async function createCategoryAction(input: CreateCategoryInput) {
  const user = await requireUser()
  const parsed = createCategorySchema.parse(input)
  const created = await categoriesService.createCategory(user.id, parsed)
  revalidateCategoryConsumers()
  return created
}

export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput
) {
  const user = await requireUser()
  const parsed = updateCategorySchema.parse(input)
  const updated = await categoriesService.updateCategory(user.id, id, parsed)
  if (!updated) throw new Error("Category not found or not editable")
  revalidateCategoryConsumers()
  return updated
}

export async function deleteCategoryAction(id: string) {
  const user = await requireUser()
  const deleted = await categoriesService.deleteCategory(user.id, id)
  if (!deleted) throw new Error("Category not found or not deletable")
  revalidateCategoryConsumers()
  return deleted
}
