import { createBrowserClient } from "@supabase/ssr"

import { clientEnv } from "@/lib/env.client"

/** Browser-side Supabase client for use in Client Components. */
export function createClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
