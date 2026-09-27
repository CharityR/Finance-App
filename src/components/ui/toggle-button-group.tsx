"use client"

import { Button } from "@/components/ui/button"

/**
 * Extracted from the plain Button-row idiom already used for the forecast
 * horizon picker and the investments currency switcher — a small shared
 * version of the same pattern rather than a new one, so new toggles (net
 * worth reporting currency, timeframe) stay visually consistent with those.
 */
export function ToggleButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; disabled?: boolean; title?: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
