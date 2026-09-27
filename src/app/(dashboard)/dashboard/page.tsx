import Link from "next/link"
import { redirect } from "next/navigation"

import { CashFlowChart } from "@/components/dashboard/CashFlowChart"
import { NetWorthHero } from "@/components/dashboard/NetWorthHero"
import { WealthComposition } from "@/components/dashboard/WealthComposition"
import { WealthInsights } from "@/components/dashboard/WealthInsights"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import { getProfile } from "@/server/repositories/profiles.repository"
import * as dashboardService from "@/server/services/dashboard.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const profile = await getProfile(user.id)
  const currency = profile?.baseCurrency ?? "NGN"
  const overview = await dashboardService.getWealthOverview(user.id, currency)
  const primaryNetWorth =
    overview.netWorthSummaries.find((s) => s.reportingCurrency === currency) ??
    overview.netWorthSummaries[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your entire financial position, in one place.
        </p>
      </div>

      <NetWorthHero summaries={overview.netWorthSummaries} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Wealth composition
        </h2>
        <WealthComposition
          composition={primaryNetWorth.composition}
          currency={primaryNetWorth.reportingCurrency}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/goals">
          {overview.goalsSummary ? (
            <Card className="hover:bg-muted/40 h-full transition-colors">
              <CardHeader>
                <CardTitle>Goals</CardTitle>
                <CardDescription>
                  {overview.goalsSummary.overallPercentage.value.toFixed(0)}%
                  funded across {overview.goalsSummary.count} active goal
                  {overview.goalsSummary.count === 1 ? "" : "s"}
                  {overview.goalsSummary.offTrackCount > 0 &&
                    ` · ${overview.goalsSummary.offTrackCount} off track`}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="hover:bg-muted/40 h-full transition-colors">
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

        <Link href="/budgets">
          {overview.hasBudget && overview.budgetUtilization ? (
            <Card className="hover:bg-muted/40 h-full transition-colors">
              <CardHeader>
                <CardTitle>Budget utilization</CardTitle>
                <CardDescription>
                  {overview.budgetUtilization.value.toFixed(0)}% of this
                  month&apos;s budgeted categories used
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="hover:bg-muted/40 h-full transition-colors">
              <CardHeader>
                <CardTitle>No budget yet</CardTitle>
                <CardDescription>
                  Set up a budget to track spending against limits.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          What&apos;s worth your attention
        </h2>
        <WealthInsights insights={overview.insights} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Investments</h2>
        <Link href="/investments">
          {overview.investmentsSummary ? (
            <Card className="hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle>
                  {formatMoney(
                    overview.investmentsSummary.totalValue,
                    overview.investmentsSummary.currency
                  )}
                </CardTitle>
                <CardDescription>
                  {overview.investmentsSummary.holdingCount} holding
                  {overview.investmentsSummary.holdingCount === 1 ? "" : "s"}{" "}
                  ·{" "}
                  <span
                    className={
                      overview.investmentsSummary.totalGainLoss >= 0
                        ? "text-positive"
                        : "text-negative"
                    }
                  >
                    {overview.investmentsSummary.totalGainLoss >= 0 ? "+" : ""}
                    {overview.investmentsSummary.totalGainLossPercent.toFixed(1)}
                    %
                  </span>{" "}
                  all time
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle>No holdings yet</CardTitle>
                <CardDescription>
                  Add your first investment to start tracking it here.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Cash flow</h2>
        <Link href="/insights">
          <Card className="hover:bg-muted/40 transition-colors">
            <CardHeader>
              <CardTitle>This month&apos;s cash flow</CardTitle>
              <CardDescription>
                Income {formatMoney(overview.cashFlow.totalIncome.value, currency)}{" "}
                · Expenses{" "}
                {formatMoney(overview.cashFlow.totalExpenses.value, currency)} ·
                see the full trend in Insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashFlowChart
                income={overview.cashFlow.totalIncome.value}
                expense={overview.cashFlow.totalExpenses.value}
                currency={currency}
              />
            </CardContent>
          </Card>
        </Link>
      </section>

      <Link
        href="/transactions"
        className="text-primary block text-sm font-medium hover:underline"
      >
        View all transactions →
      </Link>
    </div>
  )
}
