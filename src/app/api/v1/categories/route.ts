import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { createCategorySchema } from "@/lib/validation/categories"
import * as categoriesService from "@/server/services/categories.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const categories = await categoriesService.listCategories(user.id)
  return apiSuccess(categories)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const body = await request.json()
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const created = await categoriesService.createCategory(user.id, parsed.data)
  return apiSuccess(created, { status: 201 })
}
