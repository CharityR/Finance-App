"use client"

import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * True only after the client has hydrated — false during SSR and the first
 * client render, matching them exactly (no hydration mismatch), then flips
 * without an effect+setState render pass. Used to defer anything that reads
 * a browser-only theme/preference (e.g. next-themes' resolvedTheme) until
 * it's safe to render.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
