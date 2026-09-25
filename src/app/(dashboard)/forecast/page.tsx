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

      <div className="border-muted-foreground/30 bg-muted/30 space-y-1.5 rounded-lg border border-dashed p-3 text-xs">
        <p>
          <strong>Illustrative projection only, not a guarantee.</strong> Every
          number on this page is your portfolio grown forward under three fixed,
          made-up growth rates, compounded monthly — not a prediction of what
          will actually happen.
        </p>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ background: "#64748b" }}
            />
            Conservative — 4%/year
          </span>
          <span>
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ background: "#2563eb" }}
            />
            Base — 8%/year
          </span>
          <span>
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ background: "#16a34a" }}
            />
            Optimistic — 12%/year
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio growth</CardTitle>
          <CardDescription>
            Starting value is pre-filled from your current portfolio — edit it,
            set a monthly contribution, and pick a horizon to see how the three
            scenarios above diverge.
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
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Goal trajectories
            </h2>
            <p className="text-muted-foreground text-xs">
              Uses the Base (8%/year) scenario for the on-track badge and
              required contribution below — a different, growth-assuming method
              from the on-track status shown on the Goals page.
            </p>
          </div>
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
