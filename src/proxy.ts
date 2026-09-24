import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { clientEnv } from "@/lib/env.client"

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/goals",
  "/investments",
  "/watchlist",
  "/forecast",
  "/settings",
]

const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]

/**
 * Runs on every request (see matcher below): refreshes the Supabase session
 * cookie and redirects unauthenticated visitors away from protected routes.
 * This is defense-in-depth only — every Server Function/Route Handler must
 * still verify the user itself (see the Data Security guidance in Next.js
 * 16's proxy docs); never rely on this alone.
 *
 * Uses getSession() (a local JWT decode, no network call) rather than
 * getUser() (which contacts Supabase's Auth server) deliberately: proxy.ts
 * runs as Edge Middleware at whichever Vercel edge location is closest to
 * the visitor, not pinned to the app's region the way Server Functions are
 * (see vercel.json), so a network call here pays a much larger and more
 * variable latency cost than the same call made from the actual page. The
 * real, network-verified check every protected page already does via
 * getCurrentUser() remains the actual security boundary; this is only
 * a redirect-UX convenience.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
  const isAuthPage = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
