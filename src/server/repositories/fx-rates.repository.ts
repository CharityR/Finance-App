import { db } from "@/server/db"

/** All seeded rate pairs — small table (one row per currency pair this app
 * supports), so callers that need to convert many amounts (net worth
 * aggregation) fetch this once via src/lib/fx.ts rather than round-tripping
 * per amount. */
export async function listAllRates() {
  return db.query.fxRates.findMany()
}
