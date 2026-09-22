import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { addToWatchlistSchema } from "@/lib/validation/watchlist"
import * as watchlistService from "@/server/services/watchlist.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const items = await watchlistService.listWatchlist(user.id)
  return apiSuccess(items)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const body = await request.json()
  const parsed = addToWatchlistSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const created = await watchlistService.addToWatchlist(
    user.id,
    parsed.data.securityId
  )
  return apiSuccess(created, { status: 201 })
}
