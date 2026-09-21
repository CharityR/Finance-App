import "server-only"

import { z } from "zod"

import { clientEnv } from "@/lib/env.client"

/**
 * Full env, including secrets. The `server-only` import above makes any
 * accidental import of this file from a Client Component fail the build
 * instead of leaking a secret into the browser bundle.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  PROVIDER_MODE: z.enum(["mock", "live"]).default("mock"),
})

export const serverEnv = {
  ...clientEnv,
  ...serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    PROVIDER_MODE: process.env.PROVIDER_MODE,
  }),
}
