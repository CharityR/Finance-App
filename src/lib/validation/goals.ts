import { z } from "zod"

export const goalCategorySchema = z.enum([
  "emergency_fund",
  "house",
  "car",
  "education",
  "travel",
  "retirement",
  "investment_target",
  "debt_repayment",
  "business_capital",
  "custom",
])

export const goalPrioritySchema = z.enum(["low", "medium", "high"])
export const contributionFrequencySchema = z.enum([
  "weekly",
  "monthly",
  "yearly",
])

export const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: goalCategorySchema,
  targetAmount: z.coerce.number().positive("Target must be greater than zero"),
  targetDate: z.coerce.date(),
  priority: goalPrioritySchema,
  contributionFrequency: contributionFrequencySchema,
  contributionAmount: z.coerce.number().min(0),
  currency: z.string().min(1).default("NGN"),
})
export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const updateGoalSchema = createGoalSchema.partial()
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>

export const logContributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  occurredAt: z.coerce.date(),
})
export type LogContributionInput = z.infer<typeof logContributionSchema>

export const GOAL_CATEGORY_LABELS: Record<
  z.infer<typeof goalCategorySchema>,
  string
> = {
  emergency_fund: "Emergency Fund",
  house: "House",
  car: "Car",
  education: "Education",
  travel: "Travel",
  retirement: "Retirement",
  investment_target: "Investment Target",
  debt_repayment: "Debt Repayment",
  business_capital: "Business Capital",
  custom: "Custom",
}
