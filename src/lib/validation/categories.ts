import { z } from "zod"

// A curated palette rather than a free-form color picker — keeps custom
// categories visually consistent with the seeded system ones instead of
// users picking colors that clash or fail contrast against category badges.
export const CATEGORY_COLORS = [
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#f97316",
  "#eab308",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#64748b",
] as const

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  type: z.enum(["income", "expense"]),
  color: z.enum(CATEGORY_COLORS),
})
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60).optional(),
  color: z.enum(CATEGORY_COLORS).optional(),
})
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
