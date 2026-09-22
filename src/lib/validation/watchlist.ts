import { z } from "zod"

export const addToWatchlistSchema = z.object({
  securityId: z.string().uuid(),
})
export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>
