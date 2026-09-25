"use client"

import { useCountUp } from "@/hooks/use-count-up"
import { formatMoney } from "@/lib/money"

/**
 * `kind` + primitive params rather than a `format` function — this renders
 * inside Server Components (SummaryCard, BudgetCard), and a function prop
 * can't cross the server/client boundary, only serializable values can.
 *
 * Only use this for a value shown in exactly one place on the page. Each
 * instance runs its own independent count-up animation with its own start
 * time, so the same underlying number displayed via two AnimatedNumber
 * instances (e.g. a hero total and a summary card showing the same total)
 * can visibly disagree for the ~700ms both are still animating — a real bug
 * we hit on the Investments page. When a value is (or might become)
 * duplicated elsewhere on screen, render it as plain static text instead.
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
