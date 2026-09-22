import { apiError, apiSuccess } from "@/lib/api-response"
import * as portfolioService from "@/server/services/portfolio.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const summary = await portfolioService.getPortfolioSummary(user.id)
  return apiSuccess(summary)
}
