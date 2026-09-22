import { z } from "zod"

export const createHoldingSchema = z.object({
  securityId: z.string().uuid(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  purchasePrice: z.coerce
    .number()
    .positive("Purchase price must be greater than zero"),
})
export type CreateHoldingInput = z.infer<typeof createHoldingSchema>

export const updateHoldingSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
  averageCostBasis: z.coerce.number().positive().optional(),
})
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>
