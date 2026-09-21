import { describe, expect, it } from "vitest"

import { formatMoney, roundMoney } from "@/lib/money"

describe("formatMoney", () => {
  it("formats NGN with the naira symbol", () => {
    expect(formatMoney(94000, "NGN")).toBe("₦94,000.00")
  })

  it("formats USD with the dollar symbol", () => {
    expect(formatMoney(1234.5, "USD", "en-US")).toBe("$1,234.50")
  })
})

describe("roundMoney", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundMoney(10.005)).toBe(10.01)
    expect(roundMoney(10.004)).toBe(10)
  })
})
