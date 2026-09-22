import { redirect } from "next/navigation"

import { BudgetCard } from "@/components/budgets/BudgetCard"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import { listCategoriesForUser } from "@/server/repositories/categories.repository"
import { getProfile } from "@/server/repositories/profiles.repository"
import * as budgetsService from "@/server/services/budgets.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function BudgetsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [progress, categories, profile] = await Promise.all([
    budgetsService.getBudgetWithProgress(user.id),
    listCategoriesForUser(user.id),
    getProfile(user.id),
  ])

  const expenseCategories = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({ id: c.id, name: c.name }))

  const existingLimits = Object.fromEntries(
    (progress?.categories ?? []).map((c) => [c.categoryId, c.limitAmount])
  )

  const currency = profile?.baseCurrency ?? "NGN"
  const monthLabel = new Date().toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground text-sm">{monthLabel}</p>
        </div>
        <BudgetForm
          categories={expenseCategories}
          existingLimits={existingLimits}
          trigger={
            <Button>{progress ? "Edit budget" : "Create budget"}</Button>
          }
        />
      </div>

      {!progress || progress.categories.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No budget set for this month yet. Create one to start tracking your
          spending against limits.
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Overall</CardTitle>
              <CardDescription>
                {formatMoney(progress.totalSpent, currency)} of{" "}
                {formatMoney(progress.totalLimit, currency)} spent (
                {progress.totalPercentage.toFixed(0)}%)
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progress.categories.map((c) => (
              <BudgetCard key={c.categoryId} category={c} currency={currency} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
