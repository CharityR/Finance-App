import { redirect } from "next/navigation"

import { CategoryBreakdownChart } from "@/components/insights/CategoryBreakdownChart"
import { RecurringSpendCard } from "@/components/insights/RecurringSpendCard"
import { RecurringTransactionsList } from "@/components/insights/RecurringTransactionsList"
import { SavingsRateCard } from "@/components/insights/SavingsRateCard"
import { SavingsRateChart } from "@/components/insights/SavingsRateChart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
        <SavingsRateCard trend={savingsRateTrend} currency={currency} />
        <RecurringSpendCard
          recurring={recurring}
          estimatedMonthlyRecurring={estimatedMonthlyRecurring}
          currency={currency}
        />
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
