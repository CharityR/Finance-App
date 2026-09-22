"use client"

import { useState } from "react"
import { toast } from "sonner"

import { updateNotificationPreferencesAction } from "@/app/(dashboard)/settings/actions"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const TOGGLES = [
  {
    key: "budgetExceeded",
    label: "Budget exceeded",
    description: "When you go over a category's monthly budget limit.",
  },
  {
    key: "goalOffTrack",
    label: "Goal falling behind",
    description: "When a goal is projected to miss its target date.",
  },
  {
    key: "goalContributionLogged",
    label: "Contribution logged",
    description: "Every time you log a manual contribution to a goal.",
  },
] as const

type PreferenceKey = (typeof TOGGLES)[number]["key"]

export function NotificationPreferencesForm({
  currentPreferences,
}: {
  currentPreferences: Record<PreferenceKey, boolean>
}) {
  const [preferences, setPreferences] = useState(currentPreferences)
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null)

  async function handleToggle(key: PreferenceKey, value: boolean) {
    const previous = preferences[key]
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setSavingKey(key)
    try {
      await updateNotificationPreferencesAction({ [key]: value })
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [key]: previous }))
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-4">
      {TOGGLES.map((toggle) => (
        <div
          key={toggle.key}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <Label className="text-sm font-medium">{toggle.label}</Label>
            <p className="text-muted-foreground text-xs">
              {toggle.description}
            </p>
          </div>
          <Switch
            checked={preferences[toggle.key]}
            disabled={savingKey === toggle.key}
            onCheckedChange={(value) => handleToggle(toggle.key, value)}
          />
        </div>
      ))}
    </div>
  )
}
