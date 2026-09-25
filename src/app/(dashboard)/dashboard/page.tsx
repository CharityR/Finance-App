import Link from "next/link"
import { redirect } from "next/navigation"

import { CashFlowChart } from "@/components/dashboard/CashFlowChart"
import { SummaryCard } from "@/components/dashboard/SummaryCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getProfile } from "@/server/repositories/profiles.repository"
import * as dashboardService from "@/server/services/dashboard.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const profile = await getProfile(user.id)
  const currency = profile?.baseCurrency ?? "NGN"
  const summary = await dashboardService.getDashboardSummary(user.id, currency)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your financial command center.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Cash balance"
          value={summary.cashBalance}
          href="/transactions"
        />
        <SummaryCard
          label="Income this month"
          value={summary.totalIncome}
          tone="positive"
          href="/transactions?type=income"
        />
        <SummaryCard
          label="Expenses this month"
          value={summary.totalExpenses}
          tone="negative"
          href="/transactions?type=expense"
        />
        <SummaryCard
          label="Net cash flow"
          value={summary.netCashFlow}
          tone={summary.netCashFlow.value >= 0 ? "positive" : "negative"}
          href="/insights"
        />
      </div>

      <Link href="/insights">
        <Card className="hover:bg-muted/40 transition-colors">
          <CardHeader>
            <CardTitle>This month&apos;s cash flow</CardTitle>
            <CardDescription>
              Income vs. expenses · see the full trend in Insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowChart
              income={summary.totalIncome.value}
              expense={summary.totalExpenses.value}
              currency={currency}
            />
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/budgets">
          {summary.hasBudget && summary.budgetUtilization ? (
            <Card className="hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle>Budget utilization</CardTitle>
                <CardDescription>
                  {summary.budgetUtilization.value.toFixed(0)}% of this
                  month&apos;s budgeted categories used
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle>No budget yet</CardTitle>
                <CardDescription>
                  Set up a budget to track spending against limits.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Link>

        <Link href="/goals">
          {summary.goalsSummary ? (
            <Card className="hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle>Goals</CardTitle>
                <CardDescription>
                  {summary.goalsSummary.overallPercentage.value.toFixed(0)}%
                  funded across {summary.goalsSummary.count} active goal
                  {summary.goalsSummary.count === 1 ? "" : "s"}
                  {summary.goalsSummary.offTrackCount > 0 &&
                    ` · ${summary.goalsSummary.offTrackCount} off track`}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle>No goals yet</CardTitle>
                <CardDescription>
                  Create a savings or investment goal to track progress toward
                  it.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Link>
      </div>
    </div>
  )
}
