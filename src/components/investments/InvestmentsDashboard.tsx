"use client"

import { useState } from "react"

import { AllocationChart } from "@/components/investments/AllocationChart"
import { DividendIncomeCard } from "@/components/investments/DividendIncomeCard"
import { GainLossSidebarCard } from "@/components/investments/GainLossSidebarCard"
import { HoldingsTable } from "@/components/investments/HoldingsTable"
import { NetWorthExplorer } from "@/components/investments/NetWorthExplorer"
import { NewsFeed, type NewsFeedItem } from "@/components/investments/NewsFeed"
import { PortfolioSummaryCard } from "@/components/investments/PortfolioSummaryCard"
import { TopPerformersCard } from "@/components/investments/TopPerformersCard"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tilt } from "@/components/ui/tilt"
import { formatMoney } from "@/lib/money"
import type { DividendIncomeByCurrency } from "@/server/services/dividend-income.service"
import type { HoldingValuation } from "@/server/services/holdings.service"
import type {
  NetWorthBreakdown,
  PortfolioSummaryForCurrency,
} from "@/server/services/portfolio.service"

/**
 * Replaces the old "stack every section vertically" Investments page —
 * progressive disclosure instead: one hero total, a tabbed main column
 * (Holdings / Asset allocation / News) so the page doesn't force infinite
 * scrolling, and a sidebar of glanceable stats that stay visible while you
 * switch tabs. One currency toggle at the top drives every section below
 * it, rather than each chart/table managing its own.
 */
export function InvestmentsDashboard({
  portfolioByCurrency,
  netWorthBreakdown,
  holdings,
  dividendIncome,
  news,
}: {
  portfolioByCurrency: PortfolioSummaryForCurrency[]
  netWorthBreakdown: NetWorthBreakdown[]
  holdings: HoldingValuation[]
  dividendIncome: DividendIncomeByCurrency[]
  news: NewsFeedItem[]
}) {
  const [currencyIndex, setCurrencyIndex] = useState(0)
  const summary = portfolioByCurrency[currencyIndex] ?? null

  const currencyHoldings = summary
    ? holdings.filter((h) => h.currency === summary.currency)
    : []
  const currencyBreakdown = summary
    ? netWorthBreakdown.filter((b) => b.currency === summary.currency)
    : []
  const currencyDividends = summary
    ? dividendIncome.filter((d) => d.currency === summary.currency)
    : []
  const isGain = (summary?.totalGainLoss ?? 0) >= 0

  return (
    <div className="space-y-6">
      <Tilt>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            {portfolioByCurrency.length > 1 && (
              <div className="mb-2 flex gap-2">
                {portfolioByCurrency.map((s, i) => (
                  <Button
                    key={s.currency}
                    size="sm"
                    variant={i === currencyIndex ? "default" : "outline"}
                    onClick={() => setCurrencyIndex(i)}
                  >
                    {s.currency}
                  </Button>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Total portfolio value{summary ? ` (${summary.currency})` : ""}
            </p>
            {summary ? (
              <>
                <p className="text-4xl font-semibold sm:text-5xl">
                  <AnimatedNumber
                    value={summary.totalValue}
                    kind="money"
                    currency={summary.currency}
                  />
                </p>
                <p
                  className={`text-sm font-medium ${isGain ? "text-positive" : "text-negative"}`}
                >
                  {isGain ? "+" : ""}
                  {formatMoney(summary.totalGainLoss, summary.currency)} (
                  {isGain ? "+" : ""}
                  {summary.totalGainLossPercent.toFixed(1)}%) ·{" "}
                  {summary.holdingCount} holding
                  {summary.holdingCount === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground py-4 text-sm">
                No holdings yet — add one to start tracking your portfolio.
              </p>
            )}
          </CardContent>
        </Card>
      </Tilt>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="holdings">
          <TabsList>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="allocation">Asset allocation</TabsTrigger>
            <TabsTrigger value="news">News &amp; market feed</TabsTrigger>
          </TabsList>
          <TabsContent value="holdings" className="space-y-6 pt-4">
            <NetWorthExplorer breakdown={currencyBreakdown} />
            <HoldingsTable holdings={currencyHoldings} />
          </TabsContent>
          <TabsContent value="allocation" className="space-y-4 pt-4">
            {summary && (
              <PortfolioSummaryCard
                summary={summary}
                currency={summary.currency}
              />
            )}
            <Card>
              <CardContent className="pt-2">
                <AllocationChart slices={summary?.assetClassAllocation ?? []} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="news" className="pt-4">
            <NewsFeed items={news} />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          {summary && <GainLossSidebarCard summary={summary} />}
          <TopPerformersCard holdings={currencyHoldings} />
          <DividendIncomeCard incomeByCurrency={currencyDividends} />
        </div>
      </div>
    </div>
  )
}
