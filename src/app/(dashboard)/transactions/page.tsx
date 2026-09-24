import { Download } from "lucide-react"
import { redirect } from "next/navigation"

import { ManageCategoriesDialog } from "@/components/transactions/ManageCategoriesDialog"
import { TransactionFilters } from "@/components/transactions/TransactionFilters"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { TransactionTable } from "@/components/transactions/TransactionTable"
import { Button } from "@/components/ui/button"
import { listTransactionsQuerySchema } from "@/lib/validation/transactions"
import { listCategoriesForUser } from "@/server/repositories/categories.repository"
import * as transactionsService from "@/server/services/transactions.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const filters = listTransactionsQuerySchema.parse({
    type: params.type,
    categoryId: params.categoryId,
    search: params.search,
    sort: params.sort,
    page: params.page,
  })

  const [{ rows }, categories] = await Promise.all([
    transactionsService.listTransactions(user.id, filters),
    listCategoriesForUser(user.id),
  ])

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }))

  const exportQuery = new URLSearchParams()
  if (filters.type) exportQuery.set("type", filters.type)
  if (filters.categoryId) exportQuery.set("categoryId", filters.categoryId)
  if (filters.search) exportQuery.set("search", filters.search)
  exportQuery.set("sort", filters.sort)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your income and expenses.
          </p>
        </div>
        <div className="flex gap-2">
          <ManageCategoriesDialog categories={categories} />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a href={`/api/v1/transactions/export?${exportQuery}`} download />
            }
          >
            <Download /> Export CSV
          </Button>
          <TransactionForm
            categories={categoryOptions}
            trigger={<Button>Add transaction</Button>}
          />
        </div>
      </div>
      <TransactionFilters categories={categoryOptions} />
      <TransactionTable transactions={rows} categories={categoryOptions} />
    </div>
  )
}
