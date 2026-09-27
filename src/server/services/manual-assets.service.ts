import * as repo from "@/server/repositories/manual-assets.repository"
import type { schema } from "@/server/db"
import type {
  CreateManualAssetInput,
  UpdateManualAssetInput,
} from "@/lib/validation/manual-assets"

export async function listManualAssets(
  userId: string,
  category: (typeof schema.manualAssetCategoryEnum.enumValues)[number]
) {
  return repo.listManualAssetsByCategory(userId, category)
}

export async function createManualAsset(
  userId: string,
  input: CreateManualAssetInput
) {
  return repo.createManualAsset(userId, input)
}

export async function updateManualAsset(
  userId: string,
  id: string,
  input: UpdateManualAssetInput
) {
  return repo.updateManualAsset(userId, id, input)
}

export async function deleteManualAsset(userId: string, id: string) {
  return repo.deleteManualAsset(userId, id)
}
