import { redirect } from "next/navigation"

import { WatchlistForm } from "@/components/watchlist/WatchlistForm"
import { WatchlistTable } from "@/components/watchlist/WatchlistTable"
import * as watchlistService from "@/server/services/watchlist.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function WatchlistPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const items = await watchlistService.listWatchlistWithPrices(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground text-sm">
          Keep an eye on securities you don&apos;t hold yet.
        </p>
      </div>
      <WatchlistForm />
      <WatchlistTable items={items} />
    </div>
  )
}
