import * as repo from "@/server/repositories/categories.repository"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validation/categories"

export async function listCategories(userId: string) {
  return repo.listCategoriesForUser(userId)
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput
) {
  return repo.createCategory(userId, input)
}

export async function updateCategory(
  userId: string,
  id: string,
  input: UpdateCategoryInput
) {
  return repo.updateCategory(userId, id, input)
}

export async function deleteCategory(userId: string, id: string) {
  return repo.deleteCategory(userId, id)
}
