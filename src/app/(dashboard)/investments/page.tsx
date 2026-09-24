import { redirect } from "next/navigation"

import { AllocationChart } from "@/components/investments/AllocationChart"
import { DividendIncomeCard } from "@/components/investments/DividendIncomeCard"
import { HoldingForm } from "@/components/investments/HoldingForm"
import { HoldingsTable } from "@/components/investments/HoldingsTable"
import { NetWorthExplorer } from "@/components/investments/NetWorthExplorer"
import { NewsFeed } from "@/components/investments/NewsFeed"
import { PortfolioSummaryCard } from "@/components/investments/PortfolioSummaryCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import * as dividendIncomeService from "@/server/services/dividend-income.service"
import * as holdingsService from "@/server/services/holdings.service"
import * as newsService from "@/server/services/news.service"
import * as portfolioService from "@/server/services/portfolio.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function InvestmentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [
    holdings,
    portfolioByCurrency,
    netWorthBreakdown,
    dividendIncome,
    news,
  ] = await Promise.all([
    holdingsService.listHoldingsWithValuation(user.id),
    portfolioService.getPortfolioSummary(user.id),
    portfolioService.getNetWorthBreakdown(user.id),
    dividendIncomeService.getEstimatedAnnualIncome(user.id),
    newsService.getRelevantNews(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investments</h1>
          <p className="text-muted-foreground text-sm">
            Track your holdings and allocation. Prices are mock data for now.
          </p>
        </div>
        <HoldingForm trigger={<Button>Add holding</Button>} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net worth explorer</CardTitle>
          <CardDescription>
            Start at your total value, then click through to see which countries
            and sectors it&apos;s invested in.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <NetWorthExplorer breakdown={netWorthBreakdown} />
        </div>
      </Card>

      {portfolioByCurrency.map((summary) => (
        <div key={summary.currency} className="space-y-4">
          <PortfolioSummaryCard summary={summary} currency={summary.currency} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Asset allocation ({summary.currency})
              </CardTitle>
            </CardHeader>
            <AllocationChart slices={summary.assetClassAllocation} />
          </Card>
        </div>
      ))}

      <DividendIncomeCard incomeByCurrency={dividendIncome} />

      <HoldingsTable holdings={holdings} />

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Relevant news
        </h2>
        <NewsFeed items={news} />
      </div>
    </div>
  )
}
