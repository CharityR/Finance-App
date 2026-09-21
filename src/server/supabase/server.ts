import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { clientEnv } from "@/lib/env.client"

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes the session via cookies.
 *
 * Setting cookies from a Server Component (rather than a Server Action or
 * Route Handler) throws — this is expected and safe to ignore as long as
 * `proxy.ts` is refreshing the session on every request.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component; proxy.ts handles the refresh.
          }
        },
      },
    }
  )
}
