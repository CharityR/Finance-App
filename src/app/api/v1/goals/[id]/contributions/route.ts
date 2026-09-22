import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { logContributionSchema } from "@/lib/validation/goals"
import * as goalsService from "@/server/services/goals.service"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const body = await request.json()
  const parsed = logContributionSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const result = await goalsService.logContribution(
    user.id,
    id,
    parsed.data.amount,
    parsed.data.occurredAt
  )
  if (!result) return apiError("not_found", "Goal not found", 404)

  return apiSuccess(result, { status: 201 })
}
