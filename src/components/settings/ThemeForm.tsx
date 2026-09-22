"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { updateProfileAction } from "@/app/(dashboard)/settings/actions"
import { cn } from "@/lib/utils"
import { THEME_PALETTES, type ThemePaletteId } from "@/lib/theme-palettes"

export function ThemeForm({
  currentPalette,
}: {
  currentPalette: ThemePaletteId
}) {
  const [selected, setSelected] = useState(currentPalette)
  const [isSaving, setIsSaving] = useState<ThemePaletteId | null>(null)

  // Applies instantly on click via state, before the save round-trip
  // resolves; reverting `selected` on a failed save re-runs this and
  // restores the previous palette without a manual DOM mutation.
  useEffect(() => {
    document.documentElement.dataset.theme = selected
  }, [selected])

  async function handleSelect(id: ThemePaletteId) {
    if (id === selected) return
    const previous = selected
    setSelected(id)
    setIsSaving(id)
    try {
      await updateProfileAction({ themePalette: id })
      toast.success("Theme updated")
    } catch (err) {
      setSelected(previous)
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {THEME_PALETTES.map((palette) => (
        <button
          key={palette.id}
          type="button"
          onClick={() => handleSelect(palette.id)}
          disabled={isSaving !== null}
          className={cn(
            "flex w-24 flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors",
            selected === palette.id
              ? "border-primary ring-primary/30 ring-2"
              : "border-border hover:bg-muted/50"
          )}
        >
          <span
            className="size-8 rounded-full border"
            style={{ backgroundColor: palette.swatch }}
            aria-hidden
          />
          {palette.label}
        </button>
      ))}
    </div>
  )
}
