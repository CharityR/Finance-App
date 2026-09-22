import * as securitiesRepo from "@/server/repositories/securities.repository"
import * as watchlistRepo from "@/server/repositories/watchlist.repository"

export type WatchlistItemWithPrice = {
  id: string
  securityId: string
  ticker: string
  name: string
  assetClass: string
  sector: string | null
  country: string
  currency: string
  currentPrice: number | null
  priceChangePercent: number | null
}

export async function listWatchlist(userId: string) {
  return watchlistRepo.listWatchlist(userId)
}

export async function listWatchlistWithPrices(
  userId: string
): Promise<WatchlistItemWithPrice[]> {
  const items = await watchlistRepo.listWatchlist(userId)

  return Promise.all(
    items.map(async (item) => {
      const history = await securitiesRepo.getPriceHistory(item.securityId, 2)
      const [latest, previous] = history
      const currentPrice = latest ? Number(latest.price) : null
      const priceChangePercent =
        latest && previous && Number(previous.price) > 0
          ? ((Number(latest.price) - Number(previous.price)) /
              Number(previous.price)) *
            100
          : null

      return {
        id: item.id,
        securityId: item.securityId,
        ticker: item.security.ticker,
        name: item.security.name,
        assetClass: item.security.assetClass,
        sector: item.security.sector,
        country: item.security.country,
        currency: item.security.currency,
        currentPrice,
        priceChangePercent,
      }
    })
  )
}

export async function addToWatchlist(userId: string, securityId: string) {
  return watchlistRepo.addToWatchlist(userId, securityId)
}

export async function removeFromWatchlist(userId: string, id: string) {
  return watchlistRepo.removeFromWatchlist(userId, id)
}
