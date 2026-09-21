import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/server/supabase/server"

/**
 * Handles the redirect after email confirmation / password reset links.
 * Exchanges the one-time `code` for a session, then sends the user on to
 * wherever they were headed (or the dashboard by default).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not verify your request`
  )
}
