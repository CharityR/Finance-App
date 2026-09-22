import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { createHoldingSchema } from "@/lib/validation/holdings"
import * as holdingsService from "@/server/services/holdings.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const holdings = await holdingsService.listHoldingsWithValuation(user.id)
  return apiSuccess(holdings)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const body = await request.json()
  const parsed = createHoldingSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const created = await holdingsService.addHolding(user.id, parsed.data)
  return apiSuccess(created, { status: 201 })
}
