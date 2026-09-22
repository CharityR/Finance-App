/**
 * Pure projection math — no DB access, so both server (API routes) and
 * client (interactive sliders) can call it directly for instant feedback.
 *
 * Fixed, clearly-labeled scenario assumptions, not predictions. A real
 * product might let advanced users tune these, but even then they'd stay
 * explicit assumptions the UI always shows alongside the numbers they
 * produce, never bare figures presented as fact.
 */
export const GROWTH_SCENARIOS = {
  conservative: 0.04,
  base: 0.08,
  optimistic: 0.12,
} as const
export type ScenarioName = keyof typeof GROWTH_SCENARIOS

export type YearlyPoint = { year: number; value: number }

/** Monthly-compounding projection: value_{m+1} = value_m * (1 + r/12) + contribution. */
export function projectSeries(
  currentValue: number,
  monthlyContribution: number,
  years: number,
  annualRate: number
): YearlyPoint[] {
  const monthlyRate = annualRate / 12
  const points: YearlyPoint[] = [{ year: 0, value: currentValue }]

  let value = currentValue
  for (let month = 1; month <= years * 12; month++) {
    value = value * (1 + monthlyRate) + monthlyContribution
    if (month % 12 === 0) {
      points.push({ year: month / 12, value })
    }
  }
  return points
}

export type ScenarioSeries = Record<ScenarioName, YearlyPoint[]>

export function projectScenarios(
  currentValue: number,
  monthlyContribution: number,
  years: number
): ScenarioSeries {
  return {
    conservative: projectSeries(
      currentValue,
      monthlyContribution,
      years,
      GROWTH_SCENARIOS.conservative
    ),
    base: projectSeries(
      currentValue,
      monthlyContribution,
      years,
      GROWTH_SCENARIOS.base
    ),
    optimistic: projectSeries(
      currentValue,
      monthlyContribution,
      years,
      GROWTH_SCENARIOS.optimistic
    ),
  }
}

/**
 * Solves for the level monthly contribution needed to reach `targetValue`
 * in `monthsRemaining`, given `currentValue` growing at `annualRate` — the
 * future-value-of-an-annuity formula solved for payment. Answers "what
 * contribution gets this goal back on track" under a stated growth
 * assumption (distinct from goals.service.ts's simpler
 * no-growth-assumed linear estimate).
 */
export function requiredMonthlyContribution(
  currentValue: number,
  targetValue: number,
  monthsRemaining: number,
  annualRate: number
): number {
  if (monthsRemaining <= 0) return Math.max(targetValue - currentValue, 0)

  const monthlyRate = annualRate / 12
  const futureValueOfCurrent =
    currentValue * Math.pow(1 + monthlyRate, monthsRemaining)
  const remainingNeeded = targetValue - futureValueOfCurrent

  if (remainingNeeded <= 0) return 0
  if (monthlyRate === 0) return remainingNeeded / monthsRemaining

  const annuityFactor =
    (Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate
  return remainingNeeded / annuityFactor
}

export function projectedValueAt(
  currentValue: number,
  monthlyContribution: number,
  monthsFromNow: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 12
  let value = currentValue
  for (let m = 0; m < monthsFromNow; m++) {
    value = value * (1 + monthlyRate) + monthlyContribution
  }
  return value
}

function monthlyContributionFrom(
  amount: number,
  frequency: "weekly" | "monthly" | "yearly"
): number {
  switch (frequency) {
    case "weekly":
      return amount * (52 / 12)
    case "yearly":
      return amount / 12
    case "monthly":
    default:
      return amount
  }
}

export type GoalTrajectory = {
  monthsRemaining: number
  monthlyContribution: number
  projectedByScenario: Record<ScenarioName, number>
  shortfallOrSurplus: number
  isOnTrack: boolean
  requiredMonthlyContribution: number
}

/**
 * Growth-aware complement to goals.service.ts's linear on-track check: that
 * one extrapolates from actual contribution history with no growth
 * assumption; this one projects the goal's own stated contribution plan
 * forward under each scenario's assumed investment return, so a user can
 * see how much of the gap growth alone might close versus contributions.
 */
export function projectGoalTrajectory(goal: {
  currentAmount: number
  targetAmount: number
  targetDate: Date
  contributionAmount: number
  contributionFrequency: "weekly" | "monthly" | "yearly"
}): GoalTrajectory {
  const now = new Date()
  const monthsRemaining = Math.max(
    (goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    0
  )
  const monthlyContribution = monthlyContributionFrom(
    goal.contributionAmount,
    goal.contributionFrequency
  )

  const projectedByScenario = Object.fromEntries(
    (Object.keys(GROWTH_SCENARIOS) as ScenarioName[]).map((name) => [
      name,
      projectedValueAt(
        goal.currentAmount,
        monthlyContribution,
        Math.round(monthsRemaining),
        GROWTH_SCENARIOS[name]
      ),
    ])
  ) as Record<ScenarioName, number>

  const shortfallOrSurplus = projectedByScenario.base - goal.targetAmount

  return {
    monthsRemaining,
    monthlyContribution,
    projectedByScenario,
    shortfallOrSurplus,
    isOnTrack: shortfallOrSurplus >= 0,
    requiredMonthlyContribution: requiredMonthlyContribution(
      goal.currentAmount,
      goal.targetAmount,
      Math.round(monthsRemaining),
      GROWTH_SCENARIOS.base
    ),
  }
}
