/**
 * The one interface every market-data consumer (repositories, services)
 * depends on. Nothing outside src/server/providers/ should ever import a
 * concrete adapter (Finnhub, NGN Market) directly — swapping, adding, or
 * removing a provider should never touch business logic or UI, only the
 * factory in market-data-provider.ts.
 *
 * Every method returns `null` (never throws) when that provider can't serve
 * the request right now — wrong market, free-tier plan restriction, or a
 * transient API error. `null` is a normal, expected outcome the caller is
 * required to handle (typically by falling back to another provider or to
 * mock data), not an exceptional one.
 */

export type SecurityRef = {
  ticker: string
  exchange: string
  currency: string
}

export type LiveQuote = {
  price: number
  changePercent: number | null
  currency: string
  /** ISO 8601 string, not a Date — these values round-trip through the
   * provider_cache table's JSONB column, which serializes Date objects to
   * strings anyway, so this keeps the type honest for both a fresh live
   * call and a cache hit instead of lying about a Date that cache reads
   * wouldn't actually have. */
  asOf: string
  /** Which concrete adapter actually served this — surfaced in provenance
   * metadata so the UI/audit trail can show where a number came from. */
  source: string
}

export type LiveNewsItem = {
  headline: string
  summary: string | null
  url: string
  source: string
  publishedAt: string
}

export interface MarketDataProvider {
  getQuote(security: SecurityRef): Promise<LiveQuote | null>
  getCompanyNews(
    security: SecurityRef,
    limit?: number
  ): Promise<LiveNewsItem[] | null>
}
