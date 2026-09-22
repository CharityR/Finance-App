"use client"

import { useSyncExternalStore } from "react"

function subscribe(query: string, callback: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

/**
 * Reads a media query via useSyncExternalStore rather than
 * useEffect+setState — the recommended way to subscribe to an external
 * (browser) source of truth without an extra render pass, and it also
 * reacts live if the user changes the underlying setting (e.g. OS-level
 * reduced motion) while the app is open.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    () => false
  )
}
