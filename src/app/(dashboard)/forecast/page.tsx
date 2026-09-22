import { redirect } from "next/navigation"

import { ForecastControls } from "@/components/forecast/ForecastControls"
import { GoalTrajectoryCard } from "@/components/forecast/GoalTrajectoryCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import * as goalsRepo from "@/server/repositories/goals.repository"
import { getProfile } from "@/server/repositories/profiles.repository"
import * as portfolioService from "@/server/services/portfolio.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function ForecastPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [profile, portfolioByCurrency, goals] = await Promise.all([
    getProfile(user.id),
    portfolioService.getPortfolioSummary(user.id),
    goalsRepo.listGoals(user.id),
  ])

  const currency = profile?.baseCurrency ?? "NGN"
  const primaryPortfolio =
    portfolioByCurrency.find((p) => p.currency === currency) ??
    portfolioByCurrency[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Forecast</h1>
        <p className="text-muted-foreground text-sm">
          Model where your portfolio and goals could be — not a guarantee.
        </p>
      </div>

      <div className="border-muted-foreground/30 bg-muted/30 rounded-lg border border-dashed p-3 text-xs">
        <strong>Illustrative projection only.</strong> These figures are based
        on the assumptions shown (fixed annual growth rates, compounded monthly)
        and your stated contribution — not a guarantee of future performance.
        Markets can and do perform differently.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio growth</CardTitle>
          <CardDescription>
            Adjust the starting value, monthly contribution, and horizon to see
            how the three scenarios diverge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastControls
            initialValue={primaryPortfolio?.totalValue ?? 0}
            currency={primaryPortfolio?.currency ?? currency}
          />
        </CardContent>
      </Card>

      {goals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Goal trajectories
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => (
              <GoalTrajectoryCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
