import { z } from "zod"

import { THEME_PALETTE_IDS } from "@/lib/theme-palettes"

// Only NGN is actually usable in Phase 1-5; the rest are shown in the UI as
// "coming soon" so users can see the shape of multi-currency support without
// the app pretending it works today.
export const SUPPORTED_CURRENCIES = ["NGN"] as const

export const updateProfileSchema = z.object({
  baseCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),
  themePalette: z.enum(THEME_PALETTE_IDS).optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const updateNotificationPreferencesSchema = z.object({
  budgetExceeded: z.boolean().optional(),
  goalOffTrack: z.boolean().optional(),
  goalContributionLogged: z.boolean().optional(),
  categorySpendingTrend: z.boolean().optional(),
  unusualTransaction: z.boolean().optional(),
})
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>
