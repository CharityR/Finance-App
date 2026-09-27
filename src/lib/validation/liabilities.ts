import { z } from "zod"

export const liabilityCategorySchema = z.enum([
  "mortgage",
  "loan",
  "credit_card",
  "other",
])

export const createLiabilitySchema = z.object({
  category: liabilityCategorySchema,
  name: z.string().min(1, "Name is required").max(200),
  currency: z.string().min(1).default("NGN"),
  balance: z.coerce.number().positive("Balance must be greater than zero"),
  notes: z.string().max(1000).optional(),
})
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>

export const updateLiabilitySchema = createLiabilitySchema.partial()
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>

export const LIABILITY_CATEGORY_LABELS: Record<
  z.infer<typeof liabilityCategorySchema>,
  string
> = {
  mortgage: "Mortgage",
  loan: "Loan",
  credit_card: "Credit Card",
  other: "Other",
}
