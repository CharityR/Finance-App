/**
 * Pure composition/total math — no DB or server-only imports, so it's unit
 * testable directly and safe to import from anywhere. Data-fetching lives in
 * src/server/services/net-worth.service.ts, which calls this with already
 * converted category totals.
 */

export type NetWorthCategory =
  | "cash"
  | "investments"
  | "real_estate"
  | "other_assets"
  | "liabilities"

export type NetWorthComposition = {
  category: NetWorthCategory
  label: string
  value: number
  percentage: number
}

const CATEGORY_LABELS: Record<NetWorthCategory, string> = {
  cash: "Cash & Savings",
  investments: "Investments",
  real_estate: "Real Estate",
  other_assets: "Other Assets",
  liabilities: "Liabilities",
}

/**
 * Given five already-converted category totals (all in the same reporting
 * currency), returns total assets, net worth, and the 5-row composition
 * breakdown with percentages of total assets — liabilities included as
 * their own row, not netted into the assets bar.
 */
export function buildNetWorthComposition(values: {
  cash: number
  investments: number
  realEstate: number
  otherAssets: number
  liabilities: number
}): {
  totalAssets: number
  netWorth: number
  composition: NetWorthComposition[]
} {
  const totalAssets =
    values.cash + values.investments + values.realEstate + values.otherAssets
  const netWorth = totalAssets - values.liabilities
  const pct = (value: number) =>
    totalAssets > 0 ? (value / totalAssets) * 100 : 0

  const composition: NetWorthComposition[] = [
    { category: "cash", label: CATEGORY_LABELS.cash, value: values.cash, percentage: pct(values.cash) },
    { category: "investments", label: CATEGORY_LABELS.investments, value: values.investments, percentage: pct(values.investments) },
    { category: "real_estate", label: CATEGORY_LABELS.real_estate, value: values.realEstate, percentage: pct(values.realEstate) },
    { category: "other_assets", label: CATEGORY_LABELS.other_assets, value: values.otherAssets, percentage: pct(values.otherAssets) },
    { category: "liabilities", label: CATEGORY_LABELS.liabilities, value: values.liabilities, percentage: pct(values.liabilities) },
  ]

  return { totalAssets, netWorth, composition }
}
