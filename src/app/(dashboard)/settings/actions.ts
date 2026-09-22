"use server"

import { revalidatePath } from "next/cache"

import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validation/settings"
import { updateProfile } from "@/server/repositories/profiles.repository"
import { createClient } from "@/server/supabase/server"

export async function updateProfileAction(input: UpdateProfileInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const parsed = updateProfileSchema.parse(input)
  const updated = await updateProfile(user.id, parsed)
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return updated
}
