import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { updateTransactionSchema } from "@/lib/validation/transactions"
import * as repo from "@/server/repositories/transactions.repository"
import * as transactionsService from "@/server/services/transactions.service"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const transaction = await repo.getTransaction(user.id, id)
  if (!transaction) return apiError("not_found", "Transaction not found", 404)

  return apiSuccess(transaction)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const body = await request.json()
  const parsed = updateTransactionSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const updated = await transactionsService.updateTransaction(
    user.id,
    id,
    parsed.data
  )
  if (!updated) return apiError("not_found", "Transaction not found", 404)

  return apiSuccess(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const deleted = await transactionsService.deleteTransaction(user.id, id)
  if (!deleted) return apiError("not_found", "Transaction not found", 404)

  return apiSuccess({ id: deleted.id })
}
