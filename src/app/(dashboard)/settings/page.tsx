import { redirect } from "next/navigation"

import { CurrencyForm } from "@/components/settings/CurrencyForm"
import { ThemeForm } from "@/components/settings/ThemeForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DEFAULT_THEME_PALETTE, type ThemePaletteId } from "@/lib/theme-palettes"
import { getProfile } from "@/server/repositories/profiles.repository"
import { createClient } from "@/server/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getProfile(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            Your base currency is used across budgets, transactions, and the
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyForm currentCurrency={profile?.baseCurrency ?? "NGN"} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Pick an accent color for buttons, links, and charts. Kovault
            Financial&apos;s brand mark always stays teal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeForm
            currentPalette={
              (profile?.themePalette as ThemePaletteId) ??
              DEFAULT_THEME_PALETTE
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
