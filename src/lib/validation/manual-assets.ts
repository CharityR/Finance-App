import { z } from "zod"

export const manualAssetCategorySchema = z.enum(["real_estate", "other"])

export const createManualAssetSchema = z.object({
  category: manualAssetCategorySchema,
  name: z.string().min(1, "Name is required").max(200),
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1).default("NGN"),
  value: z.coerce.number().positive("Value must be greater than zero"),
  notes: z.string().max(1000).optional(),
})
export type CreateManualAssetInput = z.infer<typeof createManualAssetSchema>

export const updateManualAssetSchema = createManualAssetSchema.partial()
export type UpdateManualAssetInput = z.infer<typeof updateManualAssetSchema>

export const MANUAL_ASSET_CATEGORY_LABELS: Record<
  z.infer<typeof manualAssetCategorySchema>,
  string
> = {
  real_estate: "Real Estate",
  other: "Other",
}
