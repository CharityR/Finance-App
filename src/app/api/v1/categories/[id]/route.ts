import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { updateCategorySchema } from "@/lib/validation/categories"
import * as categoriesService from "@/server/services/categories.service"
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
  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const updated = await categoriesService.updateCategory(
    user.id,
    id,
    parsed.data
  )
  if (!updated)
    return apiError("not_found", "Category not found or not editable", 404)

  return apiSuccess(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const deleted = await categoriesService.deleteCategory(user.id, id)
  if (!deleted)
    return apiError("not_found", "Category not found or not deletable", 404)

  return apiSuccess({ id: deleted.id })
}
