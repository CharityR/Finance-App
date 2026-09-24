import type { NextRequest } from "next/server"

import { toCsv } from "@/lib/csv"
import { listTransactionsQuerySchema } from "@/lib/validation/transactions"
import * as transactionsRepo from "@/server/repositories/transactions.repository"
import { createClient } from "@/server/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Not authenticated", { status: 401 })

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const filters = listTransactionsQuerySchema
    .omit({ page: true, pageSize: true })
    .parse(params)

  const rows = await transactionsRepo.listAllTransactionsForExport(
    user.id,
    filters
  )

  const csv = toCsv(
    ["Date", "Type", "Category", "Description", "Amount", "Currency"],
    rows.map((r) => [
      new Date(r.occurredAt).toISOString().slice(0, 10),
      r.type,
      r.category?.name ?? "Uncategorized",
      r.description ?? "",
      r.amount,
      r.currency,
    ])
  )

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
