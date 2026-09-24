"use server"

import { revalidatePath } from "next/cache"

import {
  type CreateCategoryInput,
  type UpdateCategoryInput,
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validation/categories"
import {
  updateNotificationPreferencesSchema,
  updateProfileSchema,
  type UpdateNotificationPreferencesInput,
  type UpdateProfileInput,
} from "@/lib/validation/settings"
import { updateProfile } from "@/server/repositories/profiles.repository"
import * as categoriesService from "@/server/services/categories.service"
import * as notificationsService from "@/server/services/notifications.service"
import { createClient } from "@/server/supabase/server"

async function requireUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user.id
}

export async function updateProfileAction(input: UpdateProfileInput) {
  const userId = await requireUserId()

  const parsed = updateProfileSchema.parse(input)
  const updated = await updateProfile(userId, parsed)
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return updated
}

export async function updateNotificationPreferencesAction(
  input: UpdateNotificationPreferencesInput
) {
  const userId = await requireUserId()

  const parsed = updateNotificationPreferencesSchema.parse(input)
  const updated = await notificationsService.updatePreferences(userId, parsed)
  revalidatePath("/settings")
  return updated
}

function revalidateCategoryConsumers() {
  revalidatePath("/settings")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
}

export async function createCategoryAction(input: CreateCategoryInput) {
  const userId = await requireUserId()

  const parsed = createCategorySchema.parse(input)
  const created = await categoriesService.createCategory(userId, parsed)
  revalidateCategoryConsumers()
  return created
}

export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput
) {
  const userId = await requireUserId()

  const parsed = updateCategorySchema.parse(input)
  const updated = await categoriesService.updateCategory(userId, id, parsed)
  if (!updated) throw new Error("Category not found or not editable")
  revalidateCategoryConsumers()
  return updated
}

export async function deleteCategoryAction(id: string) {
  const userId = await requireUserId()

  const deleted = await categoriesService.deleteCategory(userId, id)
  if (!deleted) throw new Error("Category not found or not deletable")
  revalidateCategoryConsumers()
  return deleted
}
