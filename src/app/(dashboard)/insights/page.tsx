import { redirect } from "next/navigation"

import { CategoryBreakdownChart } from "@/components/insights/CategoryBreakdownChart"
import { RecurringTransactionsList } from "@/components/insights/RecurringTransactionsList"
import { SavingsRateChart } from "@/components/insights/SavingsRateChart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Tilt } from "@/components/ui/tilt"
import { getProfile } from "@/server/repositories/profiles.repository"
import * as insightsService from "@/server/services/insights.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function InsightsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [profile, savingsRateTrend, categoryBreakdown, recurring] =
    await Promise.all([
      getProfile(user.id),
      insightsService.getSavingsRateTrend(user.id),
      insightsService.getCategoryBreakdown(user.id),
      insightsService.getRecurringTransactions(user.id),
    ])

  const currency = profile?.baseCurrency ?? "NGN"
  const currentMonth = savingsRateTrend[savingsRateTrend.length - 1]
  const estimatedMonthlyRecurring = recurring.reduce(
    (sum, r) => sum + r.averageAmount,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-muted-foreground text-sm">
          What your transaction history says about your money.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tilt>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Savings rate (this month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-semibold ${
                  (currentMonth?.savingsRate ?? 0) >= 0
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                <AnimatedNumber
                  value={currentMonth?.savingsRate ?? 0}
                  kind="percent"
                  decimals={0}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Estimated · of income kept, not spent
              </p>
            </CardContent>
          </Card>
        </Tilt>
        <Tilt>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Estimated recurring spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                <AnimatedNumber
                  value={estimatedMonthlyRecurring}
                  kind="money"
                  currency={currency}
                  suffix="/mo"
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Estimated · across {recurring.length} recurring transaction
                {recurring.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </Tilt>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Savings rate trend</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <SavingsRateChart trend={savingsRateTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where your money went</CardTitle>
          <CardDescription>
            This month&apos;s expenses by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart
            items={categoryBreakdown}
            currency={currency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recurring transactions</CardTitle>
          <CardDescription>
            Detected from repeating amounts and descriptions — good for spotting
            subscriptions you forgot about
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecurringTransactionsList items={recurring} />
        </CardContent>
      </Card>
    </div>
  )
}
