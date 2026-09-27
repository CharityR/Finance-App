import { describe, expect, it } from "vitest"

import { convertAmount, type FxRateTable } from "@/lib/fx"
import { buildNetWorthComposition } from "@/lib/net-worth"

const fxTable: FxRateTable = {
  rates: new Map([
    ["USD_NGN", { rate: 1600, asOf: "2026-09-01" }],
    ["NGN_USD", { rate: 1 / 1600, asOf: "2026-09-01" }],
  ]),
}

describe("convertAmount", () => {
  it("tags same-currency amounts as actual, unchanged", () => {
    const result = convertAmount(1000, "NGN", "NGN", fxTable)
    expect(result.value).toBe(1000)
    expect(result.provenance).toBe("actual")
  })

  it("converts using the direct rate and tags it estimated", () => {
    const result = convertAmount(100, "USD", "NGN", fxTable)
    expect(result.value).toBe(160000)
    expect(result.provenance).toBe("estimated")
  })

  it("converts using the inverse rate", () => {
    const result = convertAmount(160000, "NGN", "USD", fxTable)
    expect(result.value).toBeCloseTo(100, 5)
  })

  it("throws when no rate is configured for the pair", () => {
    expect(() => convertAmount(100, "GBP", "NGN", fxTable)).toThrow()
  })
})

describe("buildNetWorthComposition", () => {
  it("computes total assets and net worth as assets minus liabilities", () => {
    const { totalAssets, netWorth } = buildNetWorthComposition({
      cash: 200_000,
      investments: 500_000,
      realEstate: 300_000,
      otherAssets: 0,
      liabilities: 100_000,
    })
    expect(totalAssets).toBe(1_000_000)
    expect(netWorth).toBe(900_000)
  })

  it("returns 5 composition rows with percentages of total assets", () => {
    const { composition } = buildNetWorthComposition({
      cash: 250_000,
      investments: 750_000,
      realEstate: 0,
      otherAssets: 0,
      liabilities: 0,
    })
    expect(composition).toHaveLength(5)
    const cash = composition.find((c) => c.category === "cash")!
    const investments = composition.find((c) => c.category === "investments")!
    expect(cash.percentage).toBeCloseTo(25, 5)
    expect(investments.percentage).toBeCloseTo(75, 5)
  })

  it("shows liabilities as their own row, not netted into the assets bar", () => {
    const { composition } = buildNetWorthComposition({
      cash: 100_000,
      investments: 0,
      realEstate: 0,
      otherAssets: 0,
      liabilities: 40_000,
    })
    const liabilities = composition.find((c) => c.category === "liabilities")!
    expect(liabilities.value).toBe(40_000)
    expect(liabilities.percentage).toBeCloseTo(40, 5)
  })

  it("handles zero total assets without dividing by zero", () => {
    const { composition, totalAssets } = buildNetWorthComposition({
      cash: 0,
      investments: 0,
      realEstate: 0,
      otherAssets: 0,
      liabilities: 0,
    })
    expect(totalAssets).toBe(0)
    expect(composition.every((c) => c.percentage === 0)).toBe(true)
  })
})
