import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { serverEnv } from "@/lib/env.server"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  queryClient?: ReturnType<typeof postgres>
}

// The pooled (PgBouncer) connection string. `prepare: false` is required
// against Supabase's transaction-mode pooler, which doesn't support
// server-side prepared statements. `idle_timeout`/`max_lifetime` proactively
// recycle connections instead of letting them go stale and fail with
// ECONNRESET after sitting idle through a long dev session or Supabase's own
// pooler timing them out server-side.
const queryClient =
  globalForDb.queryClient ??
  postgres(serverEnv.DATABASE_URL, {
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient
}

export const db = drizzle(queryClient, { schema })
export { schema }
