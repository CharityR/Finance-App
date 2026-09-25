import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { projectGoalTrajectory } from "@/lib/forecast"
import { formatMoney } from "@/lib/money"

type Goal = {
  id: string
  name: string
  currentAmount: string
  targetAmount: string
  targetDate: string | Date
  contributionAmount: string
  contributionFrequency: "weekly" | "monthly" | "yearly"
  currency: string
}

export function GoalTrajectoryCard({ goal }: { goal: Goal }) {
  const trajectory = projectGoalTrajectory({
    currentAmount: Number(goal.currentAmount),
    targetAmount: Number(goal.targetAmount),
    targetDate: new Date(goal.targetDate),
    contributionAmount: Number(goal.contributionAmount),
    contributionFrequency: goal.contributionFrequency,
  })

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{goal.name}</CardTitle>
        {trajectory.isOnTrack ? (
          <Badge variant="outline">On track at Base (8%)</Badge>
        ) : (
          <Badge variant="destructive">Behind at Base (8%)</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-muted-foreground text-xs">Conservative</p>
            <p className="font-medium">
              {formatMoney(
                trajectory.projectedByScenario.conservative,
                goal.currency
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Base</p>
            <p className="font-medium">
              {formatMoney(trajectory.projectedByScenario.base, goal.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Optimistic</p>
            <p className="font-medium">
              {formatMoney(
                trajectory.projectedByScenario.optimistic,
                goal.currency
              )}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Projected at your current contribution plan vs.{" "}
          {formatMoney(Number(goal.targetAmount), goal.currency)} target:{" "}
          {trajectory.shortfallOrSurplus >= 0 ? (
            <span className="text-positive">
              +{formatMoney(trajectory.shortfallOrSurplus, goal.currency)}{" "}
              surplus
            </span>
          ) : (
            <span className="text-negative">
              {formatMoney(
                Math.abs(trajectory.shortfallOrSurplus),
                goal.currency
              )}{" "}
              shortfall
            </span>
          )}{" "}
          at Base (8%/yr)
        </p>
        {!trajectory.isOnTrack && (
          <p className="text-muted-foreground">
            To hit the target exactly at that same 8%/year growth assumption,
            you&apos;d need about{" "}
            <span className="text-foreground font-medium">
              {formatMoney(
                trajectory.requiredMonthlyContribution,
                goal.currency
              )}
              /month
            </span>
            .
          </p>
        )}
      </CardContent>
    </Card>
  )
}
