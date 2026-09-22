import { z } from "zod"

export const transactionTypeSchema = z.enum(["income", "expense"])

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().min(1).default("NGN"),
  type: transactionTypeSchema,
  description: z.string().max(500).optional(),
  occurredAt: z.coerce.date(),
})
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

export const updateTransactionSchema = createTransactionSchema.partial()
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

export const listTransactionsQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  sort: z
    .enum(["occurredAt_desc", "occurredAt_asc", "amount_desc", "amount_asc"])
    .default("occurredAt_desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>
