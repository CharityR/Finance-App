"use client"

import Link from "next/link"
import { useMemo } from "react"

import {
  fetchCashFlowSectionAction,
  fetchGoalsAndBudgetSectionAction,
  fetchNetWorthSectionAction,
} from "@/app/(dashboard)/dashboard/actions"
import { CashFlowChart } from "@/components/dashboard/CashFlowChart"
import { NetWorthHero } from "@/components/dashboard/NetWorthHero"
import { SectionBoundary } from "@/components/dashboard/SectionBoundary"
import { WealthComposition } from "@/components/dashboard/WealthComposition"
import { WealthInsights } from "@/components/dashboard/WealthInsights"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSectionData } from "@/hooks/use-section-data"
import { formatMoney } from "@/lib/money"
import { computeWealthInsights } from "@/lib/wealth-insights"

/**
 * Three independent sections, each fetched (and retried) on its own — see
 * SectionBoundary and useSectionData. Wealth Insights isn't its own fetch:
 * it's computed client-side, purely, from whichever sections have
 * successfully loaded (see the useMemo below), so a failed section just
 * means the insights that depend on it are quietly omitted rather than
 * blocking the others or showing stale/fake data.
 */
export function DashboardSections({ currency }: { currency: string }) {
  const netWorth = useSectionData(fetchNetWorthSectionAction)
  const goalsAndBudget = useSectionData(fetchGoalsAndBudgetSectionAction)
  const cashFlow = useSectionData(fetchCashFlowSectionAction)

  const primaryNetWorth =
    netWorth.state.status === "success"
      ? (netWorth.state.data.netWorthSummaries.find(
          (s) => s.reportingCurrency === currency
        ) ?? netWorth.state.data.netWorthSummaries[0])
      : null

  const insights = useMemo(() => {
    return computeWealthInsights({
      reportingCurrency: currency,
      investmentAllocation:
        netWorth.state.status === "success"
          ? (netWorth.state.data.investmentsSummary?.assetClassAllocation ??
            [])
          : [],
      goals:
        goalsAndBudget.state.status === "success"
          ? goalsAndBudget.state.data.goals.map((g) => ({
              name: g.name,
              progress: g.progress,
            }))
          : [],
      netWorthChangePercent:
        primaryNetWorth?.monthOverMonthChangePercent.value ?? 0,
      netCashFlow:
        cashFlow.state.status === "success"
          ? cashFlow.state.data.netCashFlow.value
          : 0,
      monthlyIncome:
        cashFlow.state.status === "success"
          ? cashFlow.state.data.totalIncome.value
          : 0,
      // No section that feeds insights has loaded yet — show nothing rather
      // than a callout computed from an all-zeros placeholder.
    })
  }, [netWorth.state, goalsAndBudget.state, cashFlow.state, primaryNetWorth, currency])

  const anyInsightInputLoaded =
    netWorth.state.status === "success" ||
    goalsAndBudget.state.status === "success" ||
    cashFlow.state.status === "success"

  return (
    <div className="space-y-8">
      <SectionBoundary
        state={netWorth.state}
        retry={netWorth.retry}
        label="Net worth"
        skeleton={<NetWorthHeroSkeleton />}
      >
        {(data) => <NetWorthHero summaries={data.netWorthSummaries} />}
      </SectionBoundary>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Wealth composition
        </h2>
        <SectionBoundary
          state={netWorth.state}
          retry={netWorth.retry}
          label="Wealth composition"
          skeleton={<CompositionSkeleton />}
        >
          {() =>
            primaryNetWorth ? (
              <WealthComposition
                composition={primaryNetWorth.composition}
                currency={primaryNetWorth.reportingCurrency}
              />
            ) : (
              <CompositionSkeleton />
            )
          }
        </SectionBoundary>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SectionBoundary
          state={goalsAndBudget.state}
          retry={goalsAndBudget.retry}
          label="Goals & budget"
          skeleton={
            <>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </>
          }
        >
          {(data) => (
            <>
              <Link href="/goals">
                {data.goalsSummary ? (
                  <Card className="hover:bg-muted/40 h-full transition-colors">
                    <CardHeader>
                      <CardTitle>Goals</CardTitle>
                      <CardDescription>
                        {data.goalsSummary.overallPercentage.value.toFixed(0)}%
                        funded across {data.goalsSummary.count} active goal
                        {data.goalsSummary.count === 1 ? "" : "s"}
                        {data.goalsSummary.offTrackCount > 0 &&
                          ` · ${data.goalsSummary.offTrackCount} off track`}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <Card className="hover:bg-muted/40 h-full transition-colors">
                    <CardHeader>
                      <CardTitle>No goals yet</CardTitle>
                      <CardDescription>
                        Create a savings or investment goal to track progress
                        toward it.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </Link>

              <Link href="/budgets">
                {data.hasBudget && data.budgetUtilization ? (
                  <Card className="hover:bg-muted/40 h-full transition-colors">
                    <CardHeader>
                      <CardTitle>Budget utilization</CardTitle>
                      <CardDescription>
                        {data.budgetUtilization.value.toFixed(0)}% of this
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
            </>
          )}
        </SectionBoundary>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          What&apos;s worth your attention
        </h2>
        {anyInsightInputLoaded ? (
          <WealthInsights insights={insights} />
        ) : (
          <Skeleton className="h-16 rounded-2xl" />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Investments</h2>
        <SectionBoundary
          state={netWorth.state}
          retry={netWorth.retry}
          label="Investments"
          skeleton={<Skeleton className="h-24 rounded-2xl" />}
        >
          {(data) => (
            <Link href="/investments">
              {data.investmentsSummary ? (
                <Card className="hover:bg-muted/40 transition-colors">
                  <CardHeader>
                    <CardTitle>
                      {formatMoney(
                        data.investmentsSummary.totalValue,
                        data.investmentsSummary.currency
                      )}
                    </CardTitle>
                    <CardDescription>
                      {data.investmentsSummary.holdingCount} holding
                      {data.investmentsSummary.holdingCount === 1 ? "" : "s"}{" "}
                      ·{" "}
                      <span
                        className={
                          data.investmentsSummary.totalGainLoss >= 0
                            ? "text-positive"
                            : "text-negative"
                        }
                      >
                        {data.investmentsSummary.totalGainLoss >= 0 ? "+" : ""}
                        {data.investmentsSummary.totalGainLossPercent.toFixed(
                          1
                        )}
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
          )}
        </SectionBoundary>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Cash flow</h2>
        <SectionBoundary
          state={cashFlow.state}
          retry={cashFlow.retry}
          label="Cash flow"
          skeleton={<Skeleton className="h-64 rounded-2xl" />}
        >
          {(data) => (
            <Link href="/insights">
              <Card className="hover:bg-muted/40 transition-colors">
                <CardHeader>
                  <CardTitle>This month&apos;s cash flow</CardTitle>
                  <CardDescription>
                    Income {formatMoney(data.totalIncome.value, currency)} ·
                    Expenses {formatMoney(data.totalExpenses.value, currency)}{" "}
                    · see the full trend in Insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CashFlowChart
                    income={data.totalIncome.value}
                    expense={data.totalExpenses.value}
                    currency={currency}
                  />
                </CardContent>
              </Card>
            </Link>
          )}
        </SectionBoundary>
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

function NetWorthHeroSkeleton() {
  return (
    <div className="space-y-4 border-b pb-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}

function CompositionSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  )
}
