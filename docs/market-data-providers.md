# Market data providers

Kovault Financial gets live market data from two providers, routed behind a
single abstraction (`src/server/providers/`) so neither one is hardcoded into
business logic or the UI. This document covers exactly what each provider is
used for, their free-tier limits, and what will need a paid plan (or a
different provider) as the product grows.

## Architecture

```
src/server/providers/
  ports/market-data.port.ts              <- the only interface consumers see
  adapters/
    mock/mock-market-data.adapter.ts     <- reads the seeded DB tables
    finnhub/finnhub-market-data.adapter.ts
    ngn-market/ngn-market-market-data.adapter.ts
  market-data-provider.ts                <- factory/router + caching
```

Every consumer (`securities.repository.ts`, `news.service.ts`) imports only
`marketDataProvider` from `market-data-provider.ts` — never a concrete
adapter. That router:

1. Picks an adapter by the security's `exchange` field: `NGX` → NGN Market,
   everything else → Finnhub.
2. Checks `provider_cache` for a fresh cached response before calling out
   (see **Caching** below).
3. Falls back to the `mock` adapter — the same seeded fixture data the app
   used before this integration existed — whenever the live adapter returns
   `null` (unsupported market, free-tier plan restriction, or an API error).

Swapping NGN Market for a different NGX source later (e.g. adding iTick as a
supplement, or replacing it outright) means writing one more adapter and
changing `market-data-provider.ts`'s `pickLiveAdapter` — no repository,
service, or component changes.

`PROVIDER_MODE=mock` (the default) skips all of this and behaves exactly as
before Phase 8 — set `PROVIDER_MODE=live` plus both API keys to enable it.

## What's actually live right now

| Feature                    | NGX securities | International securities |
| -------------------------- | -------------- | ------------------------ |
| Current price / day change | ✅ NGN Market  | ✅ Finnhub               |
| Company news               | ❌ mock only   | ✅ Finnhub               |
| Historical price chart     | ❌ mock only   | ❌ mock only             |
| Dividend history           | ❌ mock only   | ❌ mock only             |
| Company profile detail     | ❌ mock only   | n/a (not used)           |

Both "current price" and "watchlist price/change" (`securities.repository.ts`
→ `getLatestPrices`) and the relevant-news feed + company detail page news
(`news.service.ts`) go through the router above. Everything else
(`getPriceHistory`, `getDividendHistory`) still reads only from the seeded
`price_snapshot`/`dividend_event` tables — **neither provider's free tier
supports historical charts or dividends**, so there was nothing to wire up
yet; see the table below for what unlocks them.

## Finnhub — exact usage

Verified against the live API with the account's real key (not just docs),
2026-09-24.

| Endpoint              | Used for                    | Free tier?                                                 |
| --------------------- | --------------------------- | ---------------------------------------------------------- |
| `GET /quote`          | Current price + % change    | ✅ Yes                                                     |
| `GET /company-news`   | Recent headlines, real URLs | ✅ Yes                                                     |
| `GET /stock/candle`   | Historical OHLC             | ❌ 403 `"You don't have access to this resource."`         |
| `GET /stock/dividend` | Dividend history            | ❌ Same 403                                                |
| `GET /stock/profile2` | Company profile             | ✅ Yes (not currently consumed — no unmet need for it yet) |

- **Auth**: `token` query parameter.
- **Rate limit**: 60 requests/minute (confirmed via the `x-ratelimit-limit`
  response header on a live call).
- **Coverage**: NASDAQ, NYSE, NYSEARCA tickers only (the securities already
  seeded — AAPL, MSFT, GOOGL, AMZN, JNJ, SPY, VOO, GLD). Any other exchange
  returns `null` from this adapter and falls through to NGN Market or mock.

## NGN Market — exact usage

Also verified against the live API with the account's real key, 2026-09-24.
Docs: [docs.ngnmarket.com](https://docs.ngnmarket.com/introduction).

| Endpoint                            | Used for                                           | Free tier?                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /companies?search={ticker}`    | Current price + % change (list endpoint, filtered) | ✅ Yes                                                                                                                                        |
| `GET /companies/{symbol}`           | Full company detail                                | ❌ `PLAN_REQUIRED`, needs Hobby+                                                                                                              |
| `GET /companies/{symbol}/chart`     | Historical OHLC                                    | ❌ `PLAN_REQUIRED`, needs Hobby+                                                                                                              |
| `GET /companies/{symbol}/dividends` | Dividend history                                   | ❌ Needs Starter+                                                                                                                             |
| `GET /companies/{symbol}/news`      | Company news                                       | ❌ Needs Starter+ (code already calls this — returns `null` today, will start working the moment the account upgrades, no code change needed) |
| `GET /market/snapshot`              | NGX index/market overview                          | ✅ Yes (not currently consumed — no dashboard tile for it yet)                                                                                |

- **Auth**: `Authorization: Bearer ngm_live_...` header.
- **Free-tier quota**: **3,000 calls/month, 30 requests/minute.** This is
  the binding constraint on the whole integration — see Caching below.
- **Quirk**: there's no free per-symbol "detail" endpoint. The current-price
  feature uses the _list_ endpoint (`/companies?search=X`) instead, which
  free-tier accounts can call and which already returns price, day change,
  sector, and 52-week range per company.
- **Coverage**: securities with `exchange = "NGX"` only (DANGCEM, MTNN,
  GTCO, ZENITHBANK, BUACEMENT, NESTLE in the current seed data).

## Caching — why it exists

NGN Market's free tier is roughly **100 calls/day**. Without caching, a
handful of people loading the watchlist or investments page a few times each
would burn through the entire monthly quota in hours. Every live call goes
through `provider_cache` (a table stubbed in Phase 0 for exactly this) first:

- **Quotes**: 5-minute TTL.
- **News**: 1-hour TTL.

Cache key is `{provider}:{dataType}:{provider}:{ticker}`. This means the
_first_ person to load a given ticker within the TTL window pays the API
call; everyone else in that window gets the cached value. Worth knowing if a
number looks "stale by a few minutes" — that's the cache working as intended,
not a bug.

## Free-tier limitations that affect the MVP today

- **No live NGX historical charts.** The Investments → company detail page's
  "Price history" chart is mock data for every NGX ticker, full stop, until
  NGN Market is upgraded to Hobby (₦15,000/mo, unlocks 2 years of history).
- **No live NGX dividends or news.** Same page's dividend history and any
  NGX-specific news are mock, until NGN Market is upgraded to Starter
  (₦50,000/mo).
- **No live international historical charts or dividends.** Finnhub's free
  tier flatly excludes `/stock/candle` and `/stock/dividend` — this isn't a
  Kovault gap, it's a hard wall on Finnhub's free plan. A paid Finnhub plan
  or a different provider (e.g. Twelve Data, which was evaluated earlier)
  would be needed to close this for international tickers specifically.
- **3,000 calls/month ceiling on NGX data generally.** Even with caching,
  real usage growth (more users, more NGX holdings/watchlist entries) will
  hit this. Watch `provider_cache` growth and NGN Market's dashboard usage
  page as a leading indicator.
- **NGX company "detail" (about text, shares outstanding, TTM financials,
  ratios) isn't available at all on free** — Kovault doesn't currently
  surface these fields anywhere, so this is a latent gap rather than a
  regression, but it blocks ever adding an NGX equivalent of Finnhub's
  company-profile card without an upgrade.

## What needs a paid tier (or a different provider) later

| Planned feature                                                     | Blocker                                         | Fix                                                                                                                                                                                       |
| ------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live NGX price charts (company detail page)                         | NGN Market free tier                            | Upgrade to Hobby (₦15,000/mo)                                                                                                                                                             |
| Live NGX dividend history                                           | NGN Market free tier                            | Upgrade to Starter (₦50,000/mo)                                                                                                                                                           |
| Live NGX company news                                               | NGN Market free tier                            | Upgrade to Starter (₦50,000/mo) — **the code is already written and will activate automatically**, see the table above                                                                    |
| Live international historical charts                                | Finnhub free tier                               | Paid Finnhub plan, or swap in Twelve Data/similar for this one capability (the adapter pattern supports adding a second international provider the same way NGN Market was added for NGX) |
| Live international dividend history                                 | Finnhub free tier                               | Same as above                                                                                                                                                                             |
| Full NGX company profile (About, financial ratios, insider trades)  | NGN Market free tier                            | Starter (news/dividends) or Pro (full financials) depending on which fields matter                                                                                                        |
| Sub-5-minute "real-time" quotes                                     | Both providers' rate limits + our own cache TTL | Raise NGN Market's plan for its 30/min ceiling, and/or shorten `QUOTE_CACHE_MS` once quota allows it                                                                                      |
| A second NGX data source (redundancy, or better free-tier coverage) | N/A — deliberately deferred                     | Add an adapter for iTick or mystocks.africa (evaluated, not chosen for this MVP pass per product owner's call) behind the same `MarketDataProvider` interface                             |

## Where the keys live

`FINNHUB_API_KEY` and `NGN_MARKET_API_KEY` are server-only env vars (see
`src/lib/env.server.ts`), read only inside the two adapters. Never exposed to
the client. Set in `.env.local` for local dev; must also be set in Vercel's
project environment variables for production — see `.env.example` for the
full list.
