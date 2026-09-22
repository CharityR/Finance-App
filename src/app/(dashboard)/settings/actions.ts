"use server"

import { revalidatePath } from "next/cache"

import {
  updateNotificationPreferencesSchema,
  updateProfileSchema,
  type UpdateNotificationPreferencesInput,
  type UpdateProfileInput,
} from "@/lib/validation/settings"
import { updateProfile } from "@/server/repositories/profiles.repository"
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
