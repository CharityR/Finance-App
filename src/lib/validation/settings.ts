import { z } from "zod"

// Only NGN is actually usable in Phase 1-5; the rest are shown in the UI as
// "coming soon" so users can see the shape of multi-currency support without
// the app pretending it works today.
export const SUPPORTED_CURRENCIES = ["NGN"] as const

export const updateProfileSchema = z.object({
  baseCurrency: z.enum(SUPPORTED_CURRENCIES),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
