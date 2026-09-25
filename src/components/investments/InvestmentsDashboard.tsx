"use client"

import { LineChart } from "lucide-react"
import { useState } from "react"

import { AllocationChart } from "@/components/investments/AllocationChart"
import { DividendIncomeCard } from "@/components/investments/DividendIncomeCard"
import { HoldingsTable } from "@/components/investments/HoldingsTable"
import { NetWorthExplorer } from "@/components/investments/NetWorthExplorer"
import { NewsFeed, type NewsFeedItem } from "@/components/investments/NewsFeed"
import { TopPerformersCard } from "@/components/investments/TopPerformersCard"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"
import { formatMoney } from "@/lib/money"
import type { DividendIncomeByCurrency } from "@/server/services/dividend-income.service"
import type { HoldingValuation } from "@/server/services/holdings.service"
import type {
  NetWorthBreakdown,
  PortfolioSummaryForCurrency,
} from "@/server/services/portfolio.service"

/**
 * Redesigned per the required hierarchy: title/action (page.tsx) -> compact
 * summary -> holdings -> allocation/performance -> dividend income -> news.
 * One flat column with section headings and dividers, not cards-inside-cards
 * competing for attention, and the total value/gain-loss appear exactly
 * once (the summary strip) — nowhere below repeats them.
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

  if (!summary) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon={LineChart}
          title="No holdings yet"
          description="Add your first one to start tracking your portfolio's value and performance."
        />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            News &amp; market feed
          </h2>
          <NewsFeed items={news} />
        </section>
      </div>
    )
  }

  const currencyHoldings = holdings.filter(
    (h) => h.currency === summary.currency
  )
  const currencyBreakdown = netWorthBreakdown.filter(
    (b) => b.currency === summary.currency
  )
  const currencyDividends = dividendIncome.filter(
    (d) => d.currency === summary.currency
  )
  const isGain = summary.totalGainLoss >= 0

  return (
    <div className="space-y-8">
      {/* Compact summary — total value, gain/loss, and holding count appear
          here once and nowhere else on this page. */}
      <section className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b pb-5">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <div>
            <p className="text-muted-foreground text-xs">
              Total value ({summary.currency})
            </p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatMoney(summary.totalValue, summary.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Gain / loss</p>
            <p
              className={`text-lg font-medium ${isGain ? "text-positive" : "text-negative"}`}
            >
              {isGain ? "+" : ""}
              {formatMoney(summary.totalGainLoss, summary.currency)} (
              {isGain ? "+" : ""}
              {summary.totalGainLossPercent.toFixed(1)}%)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Holdings</p>
            <p className="text-lg font-medium">{summary.holdingCount}</p>
          </div>
        </div>

        {portfolioByCurrency.length > 1 && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-1.5">
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
            <p className="text-muted-foreground max-w-52 text-right text-xs text-balance">
              Each currency&apos;s holdings shown separately — not converted
              into the other.
            </p>
          </div>
        )}
      </section>

      {/* Holdings — right after the summary, not below several other
          sections. */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Holdings</h2>
        <HoldingsTable holdings={currencyHoldings} />
      </section>

      <Separator />

      {/* Allocation & performance */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Allocation &amp; performance
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">
              By geography
            </h3>
            <NetWorthExplorer breakdown={currencyBreakdown} />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                By asset class
              </h3>
              <AllocationChart slices={summary.assetClassAllocation} />
            </div>
            <TopPerformersCard holdings={currencyHoldings} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Dividend income */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Dividend income
        </h2>
        {currencyDividends.length > 0 ? (
          <DividendIncomeCard incomeByCurrency={currencyDividends} />
        ) : (
          <p className="text-muted-foreground text-sm">
            None of your {summary.currency} holdings pay a dividend yet.
          </p>
        )}
      </section>

      <Separator />

      {/* News & market feed */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          News &amp; market feed
        </h2>
        <NewsFeed items={news} />
      </section>
    </div>
  )
}
