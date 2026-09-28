"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { SectionState } from "@/hooks/use-section-data"

/**
 * Consistent loading/error/Retry chrome for one independent dashboard
 * section. A failed section shows its own inline error with a Retry
 * button — it never blocks or hides the rest of the page, and it never
 * substitutes fake data for what failed to load.
 */
export function SectionBoundary<T>({
  state,
  retry,
  skeleton,
  label,
  children,
}: {
  state: SectionState<T>
  retry: () => void
  skeleton: React.ReactNode
  /** Shown in the error message, e.g. "Net worth" -> "Net worth couldn't load." */
  label: string
  children: (data: T) => React.ReactNode
}) {
  if (state.status === "loading") return skeleton

  if (state.status === "error") {
    return (
      <div className="border-border/70 flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
        <AlertTriangle className="text-muted-foreground size-6" strokeWidth={1.75} />
        <p className="text-sm font-medium">{label} couldn&apos;t load</p>
        <p className="text-muted-foreground max-w-sm text-xs text-balance">
          {state.message}
        </p>
        <Button size="sm" variant="outline" onClick={retry}>
          <RefreshCw /> Retry
        </Button>
      </div>
    )
  }

  return children(state.data)
}
