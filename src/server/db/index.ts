import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { serverEnv } from "@/lib/env.server"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  queryClient?: ReturnType<typeof postgres>
}

// The pooled (PgBouncer) connection string. `prepare: false` is required
// against Supabase's transaction-mode pooler, which doesn't support
// server-side prepared statements.
const queryClient =
  globalForDb.queryClient ??
  postgres(serverEnv.DATABASE_URL, { prepare: false })

if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient
}

export const db = drizzle(queryClient, { schema })
export { schema }
