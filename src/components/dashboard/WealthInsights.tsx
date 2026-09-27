import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import Link from "next/link"

import type { WealthInsight } from "@/lib/wealth-insights"

const TONE_ICON: Record<WealthInsight["tone"], typeof Info> = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  neutral: Info,
}

const TONE_CLASS: Record<WealthInsight["tone"], string> = {
  positive: "text-positive",
  warning: "text-negative",
  neutral: "text-muted-foreground",
}

export function WealthInsights({ insights }: { insights: WealthInsight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing needs your attention right now.
      </p>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {insights.map((insight) => {
        const Icon = TONE_ICON[insight.tone]
        const row = (
          <div className="flex items-start gap-3 px-4 py-3">
            <Icon
              className={`mt-0.5 size-4 shrink-0 ${TONE_CLASS[insight.tone]}`}
            />
            <p className="text-sm">{insight.text}</p>
          </div>
        )
        return insight.href ? (
          <Link
            key={insight.id}
            href={insight.href}
            className="hover:bg-muted/40 block transition-colors"
          >
            {row}
          </Link>
        ) : (
          <div key={insight.id}>{row}</div>
        )
      })}
    </div>
  )
}
