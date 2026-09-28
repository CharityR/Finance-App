import { redirect } from "next/navigation"

import { DashboardSections } from "@/components/dashboard/DashboardSections"
import { withTimeout } from "@/lib/with-timeout"
import { getProfile } from "@/server/repositories/profiles.repository"
import { getCurrentUser } from "@/server/supabase/server"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Same non-blocking spirit as the root layout's theme lookup: which
  // currency to report in is a display preference, not something worth
  // holding up the entire page shell for. Falls back to NGN so the page
  // always renders instantly; each section below fetches its own real data
  // independently and is what can actually fail/retry.
  const profile = await withTimeout(getProfile(user.id), 2000, null)
  const currency = profile?.baseCurrency ?? "NGN"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your entire financial position, in one place.
        </p>
      </div>

      <DashboardSections currency={currency} />
    </div>
  )
}
