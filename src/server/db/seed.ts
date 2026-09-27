import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import postgres from "postgres"

config({ path: ".env.local" })

function hashOffset(ticker: string): number {
  let sum = 0
  for (const ch of ticker) sum += ch.charCodeAt(0)
  return sum % 10
}

/** Deterministic mock price series — never a real market feed. */
function mockPriceSeries(basePrice: number, ticker: string, days: number) {
  const offset = hashOffset(ticker)
  const series: number[] = []
  for (let i = 0; i < days; i++) {
    const drift = 1 + 0.003 * Math.sin(i * 1.3 + offset) + i * 0.0006
    series.push(Math.round(basePrice * drift * 100) / 100)
  }
  return series
}

async function main() {
  // A standalone connection rather than importing "./index": that module
  // pulls in env.server.ts, which imports the `server-only` guard package —
  // that guard always throws outside Next.js's bundler, so it can't be used
  // from a plain Node script like this one.
  const schema = await import("./schema")
  const { SYSTEM_INCOME_CATEGORIES, SYSTEM_EXPENSE_CATEGORIES } =
    await import("./seed-data/categories")
  const { SECURITY_FIXTURES } = await import("./seed-data/securities")
  const { NEWS_FIXTURES } = await import("./seed-data/news")

  if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL is not set — copy .env.example to .env.local")
  }

  const client = postgres(process.env.DIRECT_URL, { prepare: false })
  const db = drizzle(client, { schema })

  const existing = await db.query.categories.findMany({
    columns: { name: true, type: true },
  })
  const existingKeys = new Set(existing.map((c) => `${c.type}:${c.name}`))

  const toInsert = [
    ...SYSTEM_INCOME_CATEGORIES.map((c) => ({
      ...c,
      type: "income" as const,
      isSystem: true,
    })),
    ...SYSTEM_EXPENSE_CATEGORIES.map((c) => ({
      ...c,
      type: "expense" as const,
      isSystem: true,
    })),
  ].filter((c) => !existingKeys.has(`${c.type}:${c.name}`))

  if (toInsert.length > 0) {
    await db.insert(schema.categories).values(toInsert)
    console.log(`Seeded ${toInsert.length} system categories.`)
  } else {
    console.log("System categories already seeded, skipping.")
  }

  const existingSecurities = await db.query.securities.findMany({
    columns: { id: true, ticker: true, exchange: true },
  })
  const existingTickers = new Set(
    existingSecurities.map((s) => `${s.ticker}:${s.exchange}`)
  )
  const newFixtures = SECURITY_FIXTURES.filter(
    (f) => !existingTickers.has(`${f.ticker}:${f.exchange}`)
  )

  if (newFixtures.length > 0) {
    const insertedSecurities = await db
      .insert(schema.securities)
      .values(
        newFixtures.map((f) => ({
          ticker: f.ticker,
          name: f.name,
          exchange: f.exchange,
          assetClass: f.assetClass,
          sector: f.sector,
          country: f.country,
          currency: f.currency,
          isMock: true,
        }))
      )
      .returning()

    const now = new Date()
    const priceRows: (typeof schema.priceSnapshots.$inferInsert)[] = []
    const dividendRows: (typeof schema.dividendEvents.$inferInsert)[] = []

    for (const security of insertedSecurities) {
      const fixture = newFixtures.find(
        (f) => f.ticker === security.ticker && f.exchange === security.exchange
      )!
      const series = mockPriceSeries(fixture.basePrice, fixture.ticker, 10)
      series.forEach((price, i) => {
        const fetchedAt = new Date(now)
        fetchedAt.setDate(fetchedAt.getDate() - (series.length - 1 - i))
        priceRows.push({
          securityId: security.id,
          price: price.toString(),
          currency: fixture.currency,
          fetchedAt,
          provenance: "current",
          isMock: true,
        })
      })

      if (fixture.annualDividendPerShare > 0) {
        const pastEx = new Date(now)
        pastEx.setMonth(pastEx.getMonth() - 3)
        const pastPay = new Date(pastEx)
        pastPay.setDate(pastPay.getDate() + 14)

        const upcomingEx = new Date(now)
        upcomingEx.setMonth(upcomingEx.getMonth() + 3)
        const upcomingPay = new Date(upcomingEx)
        upcomingPay.setDate(upcomingPay.getDate() + 14)

        const perPayment = fixture.annualDividendPerShare / 2
        for (const [exDate, payDate] of [
          [pastEx, pastPay],
          [upcomingEx, upcomingPay],
        ] as const) {
          dividendRows.push({
            securityId: security.id,
            exDate: exDate.toISOString().slice(0, 10),
            payDate: payDate.toISOString().slice(0, 10),
            amountPerShare: perPayment.toString(),
            currency: fixture.currency,
            isMock: true,
          })
        }
      }
    }

    await db.insert(schema.priceSnapshots).values(priceRows)
    if (dividendRows.length > 0) {
      await db.insert(schema.dividendEvents).values(dividendRows)
    }

    console.log(
      `Seeded ${newFixtures.length} securities, ${priceRows.length} price snapshots, ${dividendRows.length} dividend events.`
    )
  } else {
    console.log("Securities already seeded, skipping.")
  }

  const [{ count: existingNewsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.newsItems)
  if (existingNewsCount === 0) {
    const allSecurities = await db.query.securities.findMany({
      columns: { id: true, ticker: true },
    })
    const securityIdByTicker = new Map(
      allSecurities.map((s) => [s.ticker, s.id])
    )
    const now = new Date()

    const newsRows: (typeof schema.newsItems.$inferInsert)[] =
      NEWS_FIXTURES.map((n) => {
        const securityId = n.ticker
          ? (securityIdByTicker.get(n.ticker) ?? null)
          : null
        if (n.ticker && !securityId) return null
        const publishedAt = new Date(now)
        publishedAt.setDate(publishedAt.getDate() - n.daysAgo)
        return {
          securityId,
          sector: n.sector,
          headline: n.headline,
          summary: n.summary,
          source: n.source,
          publishedAt,
          isMock: true,
        }
      }).filter((row): row is NonNullable<typeof row> => row !== null)

    if (newsRows.length > 0) {
      await db.insert(schema.newsItems).values(newsRows)
    }
    console.log(`Seeded ${newsRows.length} news items.`)
  } else {
    console.log("News items already seeded, skipping.")
  }

  const existingFxRate = await db.query.fxRates.findFirst({
    where: (r, { eq, and }) =>
      and(eq(r.baseCurrency, "USD"), eq(r.quoteCurrency, "NGN")),
  })
  if (!existingFxRate) {
    // A static, hand-set rate — there is no live FX provider in this app
    // yet (see src/lib/fx.ts). Update this row's value/asOf by hand if it
    // drifts too far from reality; net-worth.service.ts tags every
    // conversion that uses it "estimated", never "actual".
    await db.insert(schema.fxRates).values({
      baseCurrency: "USD",
      quoteCurrency: "NGN",
      rate: "1600",
      asOf: new Date().toISOString().slice(0, 10),
      provenance: "estimated",
    })
    console.log("Seeded USD -> NGN fx rate (1,600, static).")
  } else {
    console.log("FX rate already seeded, skipping.")
  }

  await client.end()
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
