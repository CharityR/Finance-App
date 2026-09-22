export type NewsFixture = {
  /** Ticker this headline is about, or null for a sector-wide item. */
  ticker: string | null
  sector: string | null
  headline: string
  summary: string
  source: string
  /** Days ago (0 = today) this was "published". */
  daysAgo: number
}

export const NEWS_FIXTURES: NewsFixture[] = [
  {
    ticker: "DANGCEM",
    sector: null,
    headline: "Dangote Cement reports higher export volumes",
    summary:
      "The company said export shipments from its Nigerian plants rose as regional demand for cement picked up.",
    source: "Sample Business Wire",
    daysAgo: 3,
  },
  {
    ticker: "MTNN",
    sector: null,
    headline: "MTN Nigeria expands 5G coverage to more cities",
    summary:
      "MTN Nigeria announced an expansion of its 5G network to additional urban centers as part of its infrastructure rollout.",
    source: "Sample Telecom Digest",
    daysAgo: 1,
  },
  {
    ticker: "MTNN",
    sector: null,
    headline: "MTN Nigeria declares interim dividend",
    summary:
      "The board approved an interim dividend for shareholders, citing steady subscriber growth in the period.",
    source: "Sample Business Wire",
    daysAgo: 20,
  },
  {
    ticker: "GTCO",
    sector: null,
    headline: "GTCO posts steady loan book growth",
    summary:
      "Guaranty Trust Holding Company reported continued growth in its loan portfolio amid a stable interest rate environment.",
    source: "Sample Markets Daily",
    daysAgo: 5,
  },
  {
    ticker: "ZENITHBANK",
    sector: null,
    headline: "Zenith Bank completes core banking system upgrade",
    summary:
      "The bank said the upgrade is expected to improve transaction processing speed across its branch network.",
    source: "Sample Markets Daily",
    daysAgo: 8,
  },
  {
    ticker: "AAPL",
    sector: null,
    headline: "Apple previews next update to its device lineup",
    summary:
      "Apple gave an early look at upcoming hardware refreshes expected later in the year.",
    source: "Sample Tech Wire",
    daysAgo: 2,
  },
  {
    ticker: "MSFT",
    sector: null,
    headline: "Microsoft cloud unit reports continued growth",
    summary:
      "Microsoft's cloud computing segment continued to expand, according to the company's latest business update.",
    source: "Sample Tech Wire",
    daysAgo: 4,
  },
  {
    ticker: "AMZN",
    sector: null,
    headline: "Amazon expands same-day delivery to more regions",
    summary:
      "Amazon said it is extending same-day delivery coverage to additional metropolitan areas.",
    source: "Sample Retail Digest",
    daysAgo: 6,
  },
  {
    ticker: "JNJ",
    sector: null,
    headline: "Johnson & Johnson advances late-stage drug trial",
    summary:
      "The company reported progress in a late-stage clinical trial for one of its pipeline treatments.",
    source: "Sample Health Wire",
    daysAgo: 7,
  },
  {
    ticker: "GLD",
    sector: null,
    headline: "Gold holdings see steady inflows",
    summary:
      "Gold-backed funds recorded continued inflows as investors weighed macroeconomic conditions.",
    source: "Sample Markets Daily",
    daysAgo: 3,
  },
  {
    ticker: null,
    sector: "Financials",
    headline: "Nigerian banks see resilient earnings this quarter",
    summary:
      "Several Nigerian banks reported resilient earnings, citing stable net interest margins across the sector.",
    source: "Sample Markets Daily",
    daysAgo: 10,
  },
  {
    ticker: null,
    sector: "Technology",
    headline: "Tech sector volatility continues amid rate speculation",
    summary:
      "Technology stocks saw continued price swings as investors weighed the outlook for interest rates.",
    source: "Sample Tech Wire",
    daysAgo: 1,
  },
  {
    ticker: null,
    sector: "Industrials",
    headline: "Industrial producers cite steady input costs",
    summary:
      "Producers in the industrials sector reported that input costs have stabilized after a period of volatility.",
    source: "Sample Business Wire",
    daysAgo: 12,
  },
]
