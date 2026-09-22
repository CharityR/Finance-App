import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import * as securitiesRepo from "@/server/repositories/securities.repository"
import { createClient } from "@/server/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const query = request.nextUrl.searchParams.get("q") ?? ""
  const results = await securitiesRepo.searchSecurities(query)
  return apiSuccess(results)
}
