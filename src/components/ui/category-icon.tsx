import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from "@/lib/category-icons"
import { cn } from "cn"

const SIZE_CLASSES = {
  sm: "size-6 [&_svg]:size-3.5",
  default: "size-8 [&_svg]:size-4",
} as const

/** Colored round badge with the category's icon — a visual anchor next to
 * transaction rows so a list reads at a glance instead of as plain text. */
export function CategoryIcon({
  icon,
  color,
  size = "default",
  className,
}: {
  icon: string | null
  color: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) {
  const Icon = (icon && CATEGORY_ICONS[icon]) || FALLBACK_CATEGORY_ICON
  const tint = color ?? "#64748b"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: `${tint}1a`, color: tint }}
    >
      <Icon strokeWidth={2.25} />
    </span>
  )
}
