"use server"

import { revalidatePath } from "next/cache"

import {
  createHoldingSchema,
  updateHoldingSchema,
  type CreateHoldingInput,
  type UpdateHoldingInput,
} from "@/lib/validation/holdings"
import * as holdingsService from "@/server/services/holdings.service"
import { createClient } from "@/server/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

export async function addHoldingAction(input: CreateHoldingInput) {
  const user = await requireUser()
  const parsed = createHoldingSchema.parse(input)
  const created = await holdingsService.addHolding(user.id, parsed)
  revalidatePath("/investments")
  revalidatePath("/dashboard")
  return created
}

export async function updateHoldingAction(
  id: string,
  input: UpdateHoldingInput
) {
  const user = await requireUser()
  const parsed = updateHoldingSchema.parse(input)
  const updated = await holdingsService.updateHolding(user.id, id, parsed)
  revalidatePath("/investments")
  revalidatePath("/dashboard")
  return updated
}

export async function removeHoldingAction(id: string) {
  const user = await requireUser()
  const removed = await holdingsService.removeHolding(user.id, id)
  revalidatePath("/investments")
  revalidatePath("/dashboard")
  return removed
}
