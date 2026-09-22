import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
} from "@/lib/validation/transactions"
import * as transactionsService from "@/server/services/transactions.service"
import { createClient } from "@/server/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const parsed = listTransactionsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  )
  if (!parsed.success)
    return apiError("invalid_query", parsed.error.message, 400)

  const result = await transactionsService.listTransactions(
    user.id,
    parsed.data
  )
  return apiSuccess(result)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const body = await request.json()
  const parsed = createTransactionSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const created = await transactionsService.createTransaction(
    user.id,
    parsed.data
  )
  return apiSuccess(created, { status: 201 })
}
