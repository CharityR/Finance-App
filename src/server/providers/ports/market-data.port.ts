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

export type SecurityAssetClass =
  | "stock"
  | "etf"
  | "mutual_fund"
  | "bond"
  | "treasury_bill"
  | "reit"
  | "gold"
  | "other"

/**
 * A symbol search hit. NGN Market's search endpoint returns everything
 * needed to create a securities row in one call, so `exchange`/`currency`/
 * `country`/`sector`/`assetClass` are populated immediately; Finnhub's
 * /search endpoint only returns ticker+name+type, so those fields are null
 * until resolveSecurity() looks the symbol up individually — searching is
 * cheap and can run on every keystroke, a full profile fetch isn't, so it's
 * deferred to the moment a user actually picks a result.
 */
export type SymbolSearchResult = {
  ticker: string
  name: string
  exchange: string | null
  currency: string | null
  country: string | null
  sector: string | null
  assetClass: SecurityAssetClass | null
  /** Which adapter found this — carried back to resolveSecurity() so it
   * knows which provider to ask, without the caller needing to guess from
   * the ticker alone. */
  source: "finnhub" | "ngn_market"
}

export type ResolvedSecurity = {
  ticker: string
  name: string
  exchange: string
  currency: string
  country: string
  sector: string | null
  assetClass: SecurityAssetClass
}

export interface MarketDataProvider {
  getQuote(security: SecurityRef): Promise<LiveQuote | null>
  getCompanyNews(
    security: SecurityRef,
    limit?: number
  ): Promise<LiveNewsItem[] | null>
  /** Free-text symbol/name search across this provider's universe — not
   * limited to securities already seeded in our DB. Returns [] (not null)
   * when the provider works but has no matches, since that's a real,
   * meaningful answer distinct from "this provider is unavailable." */
  searchSymbols(query: string): Promise<SymbolSearchResult[] | null>
  /** Full profile lookup for one ticker this provider previously found via
   * searchSymbols — called once, right before inserting a new securities
   * row, not on every keystroke. */
  resolveSecurity(ticker: string): Promise<ResolvedSecurity | null>
}
