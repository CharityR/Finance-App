import { z } from "zod"

export const projectPortfolioSchema = z.object({
  currentValue: z.coerce.number().min(0),
  monthlyContribution: z.coerce.number().min(0),
  years: z.coerce.number().int().min(1).max(30).default(10),
})
export type ProjectPortfolioInput = z.infer<typeof projectPortfolioSchema>
