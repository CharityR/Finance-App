import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

config({ path: ".env.local" })

async function main() {
  // A standalone connection rather than importing "./index": that module
  // pulls in env.server.ts, which imports the `server-only` guard package —
  // that guard always throws outside Next.js's bundler, so it can't be used
  // from a plain Node script like this one.
  const schema = await import("./schema")
  const { SYSTEM_INCOME_CATEGORIES, SYSTEM_EXPENSE_CATEGORIES } =
    await import("./seed-data/categories")

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

  await client.end()
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
