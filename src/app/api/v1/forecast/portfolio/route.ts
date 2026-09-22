import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { GROWTH_SCENARIOS, projectScenarios } from "@/lib/forecast"
import { projectPortfolioSchema } from "@/lib/validation/forecast"
import { createClient } from "@/server/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const body = await request.json()
  const parsed = projectPortfolioSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const scenarios = projectScenarios(
    parsed.data.currentValue,
    parsed.data.monthlyContribution,
    parsed.data.years
  )
  return apiSuccess({ scenarios, assumptions: GROWTH_SCENARIOS })
}
