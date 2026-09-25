import { redirect } from "next/navigation"

import { HoldingForm } from "@/components/investments/HoldingForm"
import { InvestmentsDashboard } from "@/components/investments/InvestmentsDashboard"
import { Button } from "@/components/ui/button"
import * as dividendIncomeService from "@/server/services/dividend-income.service"
import * as holdingsService from "@/server/services/holdings.service"
import * as newsService from "@/server/services/news.service"
import * as portfolioService from "@/server/services/portfolio.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function InvestmentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [holdings, dividendIncome, news] = await Promise.all([
    holdingsService.listHoldingsWithValuation(user.id),
    dividendIncomeService.getEstimatedAnnualIncome(user.id),
    newsService.getRelevantNews(user.id),
  ])

  // Derived from the one holdings fetch above rather than each calling its
  // own userId-based version — two independent fetches would each hit the
  // live-quote API separately and could disagree on a holding's price
  // within the same page load, making the hero total and the drill-down
  // total not match.
  const portfolioByCurrency =
    portfolioService.summarizePortfolioByCurrency(holdings)
  const netWorthBreakdown = portfolioService.buildNetWorthBreakdown(holdings)

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

      <InvestmentsDashboard
        portfolioByCurrency={portfolioByCurrency}
        netWorthBreakdown={netWorthBreakdown}
        holdings={holdings}
        dividendIncome={dividendIncome}
        news={news}
      />
    </div>
  )
}
