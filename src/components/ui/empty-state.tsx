import type { LucideIcon } from "lucide-react"

/** Shared "nothing here yet" treatment — a tinted icon badge, a bold title,
 * a supportive one-line description, and an optional CTA — used wherever a
 * list can be empty, instead of each screen inventing its own plain dashed
 * box of muted text. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  /** Smaller padding/icon for use inside a table cell or narrow card,
   * rather than as a standalone page section. */
  compact?: boolean
}) {
  return (
    <div
      className={`border-border/70 flex flex-col items-center rounded-2xl border border-dashed text-center ${
        compact ? "gap-2 p-8" : "gap-3 p-12"
      }`}
    >
      <span
        className={`bg-primary/10 text-primary inline-flex items-center justify-center rounded-full ${
          compact ? "size-10" : "size-14"
        }`}
      >
        <Icon className={compact ? "size-5" : "size-7"} strokeWidth={1.75} />
      </span>
      <div className="space-y-1">
        <p className={compact ? "font-medium" : "text-lg font-semibold"}>
          {title}
        </p>
        <p className="text-muted-foreground max-w-sm text-sm text-balance">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
