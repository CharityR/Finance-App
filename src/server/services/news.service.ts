import * as holdingsRepo from "@/server/repositories/holdings.repository"
import * as newsRepo from "@/server/repositories/news.repository"
import * as watchlistRepo from "@/server/repositories/watchlist.repository"

/**
 * Relevance-filtered, not a firehose: only news tied to securities the user
 * actually holds or watches, or to a sector one of those securities belongs
 * to — matches the brief's "avoid a noisy feed" principle.
 */
export async function getRelevantNews(userId: string) {
  const [holdings, watchlist] = await Promise.all([
    holdingsRepo.listHoldings(userId),
    watchlistRepo.listWatchlist(userId),
  ])

  const securityIds = new Set<string>()
  const sectors = new Set<string>()

  for (const h of holdings) {
    securityIds.add(h.securityId)
    if (h.security.sector) sectors.add(h.security.sector)
  }
  for (const w of watchlist) {
    securityIds.add(w.securityId)
    if (w.security.sector) sectors.add(w.security.sector)
  }

  return newsRepo.getNewsForSecuritiesAndSectors(
    Array.from(securityIds),
    Array.from(sectors)
  )
}
