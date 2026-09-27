import { describe, expect, it } from "vitest"

import { computeWealthInsights } from "@/lib/wealth-insights"

const baseInput = {
  reportingCurrency: "NGN",
  investmentAllocation: [],
  goals: [],
  netWorthChangePercent: 0,
  netCashFlow: 0,
  monthlyIncome: 0,
}

describe("computeWealthInsights", () => {
  it("returns no insights when nothing meets any rule's threshold", () => {
    expect(computeWealthInsights(baseInput)).toEqual([])
  })

  it("flags concentration risk above 40%", () => {
    const insights = computeWealthInsights({
      ...baseInput,
      investmentAllocation: [
        { label: "Energy", value: 450, percentage: 45 },
        { label: "Tech", value: 550, percentage: 55 },
      ],
    })
    const concentration = insights.find((i) => i.id === "concentration")
    expect(concentration).toBeDefined()
    expect(concentration?.text).toContain("Tech")
    expect(concentration?.tone).toBe("warning")
  })

  it("does not flag concentration at or below 40%", () => {
    const insights = computeWealthInsights({
      ...baseInput,
      investmentAllocation: [{ label: "Tech", value: 400, percentage: 40 }],
    })
    expect(insights.find((i) => i.id === "concentration")).toBeUndefined()
  })

  it("surfaces the most off-track goal when any goal is off track", () => {
    const insights = computeWealthInsights({
      ...baseInput,
      goals: [
        { name: "House", progress: { isOnTrack: true, percentage: 80 } },
        { name: "Car", progress: { isOnTrack: false, percentage: 20 } },
      ],
    })
    const goal = insights.find((i) => i.id === "goal-progress")
    expect(goal?.text).toContain("Car")
    expect(goal?.tone).toBe("warning")
  })

  it("surfaces the closest-to-done goal when all goals are on track", () => {
    const insights = computeWealthInsights({
      ...baseInput,
      goals: [
        { name: "House", progress: { isOnTrack: true, percentage: 80 } },
        { name: "Car", progress: { isOnTrack: true, percentage: 30 } },
      ],
    })
    const goal = insights.find((i) => i.id === "goal-progress")
    expect(goal?.text).toContain("House")
    expect(goal?.tone).toBe("positive")
  })

  it("reports net worth growth as positive and decline as warning", () => {
    const grew = computeWealthInsights({
      ...baseInput,
      netWorthChangePercent: 5,
    })
    expect(grew.find((i) => i.id === "net-worth-growth")?.tone).toBe(
      "positive"
    )

    const declined = computeWealthInsights({
      ...baseInput,
      netWorthChangePercent: -5,
    })
    expect(declined.find((i) => i.id === "net-worth-growth")?.tone).toBe(
      "warning"
    )
  })

  it("flags cash-flow opportunity only when net flow is a meaningful share of income", () => {
    const meaningful = computeWealthInsights({
      ...baseInput,
      netCashFlow: 50_000,
      monthlyIncome: 400_000,
    })
    expect(
      meaningful.find((i) => i.id === "cash-flow-opportunity")
    ).toBeDefined()

    const negligible = computeWealthInsights({
      ...baseInput,
      netCashFlow: 5_000,
      monthlyIncome: 400_000,
    })
    expect(
      negligible.find((i) => i.id === "cash-flow-opportunity")
    ).toBeUndefined()
  })
})
