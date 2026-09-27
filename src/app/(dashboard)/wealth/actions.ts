"use server"

import { revalidatePath } from "next/cache"

import {
  createLiabilitySchema,
  updateLiabilitySchema,
  type CreateLiabilityInput,
  type UpdateLiabilityInput,
} from "@/lib/validation/liabilities"
import {
  createManualAssetSchema,
  updateManualAssetSchema,
  type CreateManualAssetInput,
  type UpdateManualAssetInput,
} from "@/lib/validation/manual-assets"
import * as liabilitiesService from "@/server/services/liabilities.service"
import * as manualAssetsService from "@/server/services/manual-assets.service"
import { createClient } from "@/server/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

function revalidateWealth() {
  revalidatePath("/wealth/[category]", "page")
  revalidatePath("/dashboard")
}

export async function createManualAssetAction(input: CreateManualAssetInput) {
  const user = await requireUser()
  const parsed = createManualAssetSchema.parse(input)
  const created = await manualAssetsService.createManualAsset(user.id, parsed)
  revalidateWealth()
  return created
}

export async function updateManualAssetAction(
  id: string,
  input: UpdateManualAssetInput
) {
  const user = await requireUser()
  const parsed = updateManualAssetSchema.parse(input)
  const updated = await manualAssetsService.updateManualAsset(
    user.id,
    id,
    parsed
  )
  revalidateWealth()
  return updated
}

export async function deleteManualAssetAction(id: string) {
  const user = await requireUser()
  const deleted = await manualAssetsService.deleteManualAsset(user.id, id)
  revalidateWealth()
  return deleted
}

export async function createLiabilityAction(input: CreateLiabilityInput) {
  const user = await requireUser()
  const parsed = createLiabilitySchema.parse(input)
  const created = await liabilitiesService.createLiability(user.id, parsed)
  revalidateWealth()
  return created
}

export async function updateLiabilityAction(
  id: string,
  input: UpdateLiabilityInput
) {
  const user = await requireUser()
  const parsed = updateLiabilitySchema.parse(input)
  const updated = await liabilitiesService.updateLiability(
    user.id,
    id,
    parsed
  )
  revalidateWealth()
  return updated
}

export async function deleteLiabilityAction(id: string) {
  const user = await requireUser()
  const deleted = await liabilitiesService.deleteLiability(user.id, id)
  revalidateWealth()
  return deleted
}
