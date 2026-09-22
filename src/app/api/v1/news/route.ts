import { apiError, apiSuccess } from "@/lib/api-response"
import * as newsService from "@/server/services/news.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const news = await newsService.getRelevantNews(user.id)
  return apiSuccess(news)
}
