import { redirect } from "next/navigation"

import { WatchlistForm } from "@/components/watchlist/WatchlistForm"
import { WatchlistTable } from "@/components/watchlist/WatchlistTable"
import * as securitiesRepo from "@/server/repositories/securities.repository"
import * as watchlistService from "@/server/services/watchlist.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function WatchlistPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [items, securities] = await Promise.all([
    watchlistService.listWatchlistWithPrices(user.id),
    securitiesRepo.searchSecurities(""),
  ])

  const watchedIds = new Set(items.map((i) => i.securityId))
  const securityOptions = securities
    .filter((s) => !watchedIds.has(s.id))
    .map((s) => ({ id: s.id, ticker: s.ticker, name: s.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground text-sm">
          Keep an eye on securities you don&apos;t hold yet.
        </p>
      </div>
      <WatchlistForm securities={securityOptions} />
      <WatchlistTable items={items} />
    </div>
  )
}
