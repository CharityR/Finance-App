export type SecurityFixture = {
  ticker: string
  name: string
  exchange: string
  assetClass:
    | "stock"
    | "etf"
    | "mutual_fund"
    | "bond"
    | "treasury_bill"
    | "reit"
    | "gold"
    | "other"
  sector: string | null
  country: string
  currency: string
  basePrice: number
  /** Annual dividend per share; 0 means this security doesn't pay one. */
  annualDividendPerShare: number
}

export const SECURITY_FIXTURES: SecurityFixture[] = [
  // Nigerian stocks (NGX)
  {
    ticker: "DANGCEM",
    name: "Dangote Cement Plc",
    exchange: "NGX",
    assetClass: "stock",
    sector: "Industrials",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 450,
    annualDividendPerShare: 0,
  },
  {
    ticker: "MTNN",
    name: "MTN Nigeria Communications Plc",
    exchange: "NGX",
    assetClass: "stock",
    sector: "Communication Services",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 220,
    annualDividendPerShare: 14,
  },
  {
    ticker: "GTCO",
    name: "Guaranty Trust Holding Company Plc",
    exchange: "NGX",
    assetClass: "stock",
    sector: "Financials",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 55,
    annualDividendPerShare: 3.65,
  },
  {
    ticker: "ZENITHBANK",
    name: "Zenith Bank Plc",
    exchange: "NGX",
    assetClass: "stock",
    sector: "Financials",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 40,
    annualDividendPerShare: 4.0,
  },
  {
    ticker: "BUACEMENT",
    name: "BUA Cement Plc",
    exchange: "NGX",
    assetClass: "stock",
    sector: "Industrials",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 95,
    annualDividendPerShare: 0,
  },
  {
    ticker: "NESTLE",
    name: "Nestle Nigeria Plc",
    exchange: "NGX",
    assetClass: "stock",
    sector: "Consumer Defensive",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 1200,
    annualDividendPerShare: 45,
  },
  // US stocks
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    assetClass: "stock",
    sector: "Technology",
    country: "United States",
    currency: "USD",
    basePrice: 230,
    annualDividendPerShare: 1.0,
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    assetClass: "stock",
    sector: "Technology",
    country: "United States",
    currency: "USD",
    basePrice: 430,
    annualDividendPerShare: 3.0,
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    exchange: "NASDAQ",
    assetClass: "stock",
    sector: "Communication Services",
    country: "United States",
    currency: "USD",
    basePrice: 175,
    annualDividendPerShare: 0,
  },
  {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    exchange: "NASDAQ",
    assetClass: "stock",
    sector: "Consumer Cyclical",
    country: "United States",
    currency: "USD",
    basePrice: 185,
    annualDividendPerShare: 0,
  },
  {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    exchange: "NYSE",
    assetClass: "stock",
    sector: "Healthcare",
    country: "United States",
    currency: "USD",
    basePrice: 155,
    annualDividendPerShare: 4.8,
  },
  // ETFs
  {
    ticker: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    exchange: "NYSEARCA",
    assetClass: "etf",
    sector: null,
    country: "United States",
    currency: "USD",
    basePrice: 560,
    annualDividendPerShare: 6.5,
  },
  {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    exchange: "NYSEARCA",
    assetClass: "etf",
    sector: null,
    country: "United States",
    currency: "USD",
    basePrice: 515,
    annualDividendPerShare: 6.2,
  },
  // Treasury bill
  {
    ticker: "NTB91",
    name: "Nigerian 91-Day Treasury Bill",
    exchange: "FMDQ",
    assetClass: "treasury_bill",
    sector: null,
    country: "Nigeria",
    currency: "NGN",
    basePrice: 100,
    annualDividendPerShare: 0,
  },
  // REIT
  {
    ticker: "UPDCREIT",
    name: "UPDC Real Estate Investment Trust",
    exchange: "NGX",
    assetClass: "reit",
    sector: "Real Estate",
    country: "Nigeria",
    currency: "NGN",
    basePrice: 4.5,
    annualDividendPerShare: 0.35,
  },
  // Gold
  {
    ticker: "GLD",
    name: "SPDR Gold Shares",
    exchange: "NYSEARCA",
    assetClass: "gold",
    sector: null,
    country: "United States",
    currency: "USD",
    basePrice: 240,
    annualDividendPerShare: 0,
  },
]
