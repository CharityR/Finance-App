import { formatMoney } from "@/lib/money"
import type { AllocationSlice } from "@/server/services/portfolio.service"

export type WealthInsight = {
  id: string
  tone: "positive" | "warning" | "neutral"
  text: string
  href?: string
}

const CONCENTRATION_THRESHOLD_PERCENT = 40
const CASH_FLOW_OPPORTUNITY_MIN_SHARE = 0.1

/**
 * Four deterministic, rule-based callouts computed from data the dashboard
 * already fetches for the hero/composition/goals sections — no new queries,
 * no "opportunity engine" abstraction. Each rule is independent and only
 * contributes an insight when its condition is actually met, so an empty
 * array is a valid, expected result for a new or unremarkable account.
 */
export function computeWealthInsights(input: {
  reportingCurrency: string
  investmentAllocation: AllocationSlice[]
  goals: {
    name: string
    progress: { isOnTrack: boolean; percentage: number }
  }[]
  netWorthChangePercent: number
  netCashFlow: number
  monthlyIncome: number
}): WealthInsight[] {
  const insights: WealthInsight[] = []

  // 1. Concentration risk
  const topSlice = [...input.investmentAllocation].sort(
    (a, b) => b.percentage - a.percentage
  )[0]
  if (topSlice && topSlice.percentage > CONCENTRATION_THRESHOLD_PERCENT) {
    insights.push({
      id: "concentration",
      tone: "warning",
      text: `${topSlice.percentage.toFixed(0)}% of your investments are in ${topSlice.label} — consider diversifying.`,
      href: "/investments",
    })
  }

  // 2. Goal progress — the most off-track goal, or the closest to done if
  // every active goal is on track.
  if (input.goals.length > 0) {
    const offTrack = input.goals.filter((g) => !g.progress.isOnTrack)
    if (offTrack.length > 0) {
      const worst = [...offTrack].sort(
        (a, b) => a.progress.percentage - b.progress.percentage
      )[0]
      insights.push({
        id: "goal-progress",
        tone: "warning",
        text: `"${worst.name}" is off track at ${worst.progress.percentage.toFixed(0)}% funded.`,
        href: "/goals",
      })
    } else {
      const closest = [...input.goals].sort(
        (a, b) => b.progress.percentage - a.progress.percentage
      )[0]
      insights.push({
        id: "goal-progress",
        tone: "positive",
        text: `"${closest.name}" is ${closest.progress.percentage.toFixed(0)}% funded and on track.`,
        href: "/goals",
      })
    }
  }

  // 3. Net-worth growth
  if (Math.abs(input.netWorthChangePercent) >= 0.1) {
    const isGrowth = input.netWorthChangePercent > 0
    insights.push({
      id: "net-worth-growth",
      tone: isGrowth ? "positive" : "warning",
      text: `Your net worth ${isGrowth ? "grew" : "declined"} ${Math.abs(input.netWorthChangePercent).toFixed(1)}% this month.`,
    })
  }

  // 4. Cash-flow opportunity
  if (
    input.netCashFlow > 0 &&
    input.monthlyIncome > 0 &&
    input.netCashFlow / input.monthlyIncome > CASH_FLOW_OPPORTUNITY_MIN_SHARE
  ) {
    insights.push({
      id: "cash-flow-opportunity",
      tone: "positive",
      text: `You have ${formatMoney(input.netCashFlow, input.reportingCurrency)} of unallocated cash flow this month.`,
      href: "/goals",
    })
  }

  return insights
}
