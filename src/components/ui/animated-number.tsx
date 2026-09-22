"use client"

import { useCountUp } from "@/hooks/use-count-up"
import { formatMoney } from "@/lib/money"

/**
 * `kind` + primitive params rather than a `format` function — this renders
 * inside Server Components (SummaryCard, BudgetCard, PortfolioSummaryCard),
 * and a function prop can't cross the server/client boundary, only
 * serializable values can.
 */
type BaseProps = {
  value: number
  durationMs?: number
  suffix?: string
  showPositiveSign?: boolean
}
type AnimatedNumberProps =
  | (BaseProps & { kind: "money"; currency: string })
  | (BaseProps & { kind: "percent"; decimals?: number })

export function AnimatedNumber(props: AnimatedNumberProps) {
  const animated = useCountUp(props.value, props.durationMs)
  const sign = props.showPositiveSign && animated >= 0 ? "+" : ""
  const formatted =
    props.kind === "money"
      ? formatMoney(animated, props.currency)
      : `${animated.toFixed(props.decimals ?? 0)}%`

  return (
    <>
      {sign}
      {formatted}
      {props.suffix}
    </>
  )
}
