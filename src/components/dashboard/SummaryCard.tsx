import Link from "next/link"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tilt } from "@/components/ui/tilt"
import type { ProvenanceValue } from "@/lib/provenance"

const PROVENANCE_LABEL: Record<string, string> = {
  actual: "Actual",
  current: "Current",
  estimated: "Estimated",
  projected: "Projected",
  ai_interpretation: "AI",
}

export function SummaryCard({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string
  value: ProvenanceValue<number>
  tone?: "default" | "positive" | "negative"
  /** When set, the whole card links somewhere relevant instead of being a
   * dead-end tile — e.g. "Income this month" -> the filtered transactions
   * list that number came from. */
  href?: string
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-600"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground"

  const card = (
    <Card className={href ? "hover:bg-muted/40 transition-colors" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-normal">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${toneClass}`}>
          <AnimatedNumber
            value={value.value}
            kind="money"
            currency={value.currency ?? "NGN"}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {PROVENANCE_LABEL[value.provenance]} · as of{" "}
          {new Date(value.asOf).toLocaleDateString("en-NG")}
        </p>
      </CardContent>
    </Card>
  )

  return <Tilt>{href ? <Link href={href}>{card}</Link> : card}</Tilt>
}
