import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { updateHoldingSchema } from "@/lib/validation/holdings"
import * as holdingsService from "@/server/services/holdings.service"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const body = await request.json()
  const parsed = updateHoldingSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const updated = await holdingsService.updateHolding(user.id, id, parsed.data)
  if (!updated) return apiError("not_found", "Holding not found", 404)

  return apiSuccess(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const deleted = await holdingsService.removeHolding(user.id, id)
  if (!deleted) return apiError("not_found", "Holding not found", 404)

  return apiSuccess({ id: deleted.id })
}
