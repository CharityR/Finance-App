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
}: {
  label: string
  value: ProvenanceValue<number>
  tone?: "default" | "positive" | "negative"
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-600"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground"

  return (
    <Tilt>
      <Card>
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
    </Tilt>
  )
}
