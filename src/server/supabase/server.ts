import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

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

/**
 * `auth.getUser()` revalidates the session with Supabase's auth server over
 * the network on every call — it's not a free local JWT decode. Every
 * protected layout and page calls it independently (defense in depth, not a
 * mistake), which without this wrapper meant 3-4 sequential network round
 * trips stacked on top of each other for a single page load. React's
 * `cache()` dedupes calls with the same arguments within one server request,
 * so the whole layout/page tree shares a single request to Supabase instead.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
