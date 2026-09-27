import * as repo from "@/server/repositories/liabilities.repository"
import type {
  CreateLiabilityInput,
  UpdateLiabilityInput,
} from "@/lib/validation/liabilities"

export async function listLiabilities(userId: string) {
  return repo.listLiabilities(userId)
}

export async function createLiability(
  userId: string,
  input: CreateLiabilityInput
) {
  return repo.createLiability(userId, input)
}

export async function updateLiability(
  userId: string,
  id: string,
  input: UpdateLiabilityInput
) {
  return repo.updateLiability(userId, id, input)
}

export async function deleteLiability(userId: string, id: string) {
  return repo.deleteLiability(userId, id)
}
