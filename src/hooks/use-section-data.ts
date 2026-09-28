"use client"

import { useCallback, useEffect, useState } from "react"

export type SectionState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string }

/**
 * Fetches once on mount (via a Server Action) and again only when `retry()`
 * is explicitly called — never on an interval or automatically, so a
 * failing section can't turn into a request loop (the exact bug that made
 * the login button appear dead: a navigation racing a second automatic
 * fetch). Each dashboard section owns one of these independently, so a
 * slow/failing fetcher only affects its own section's state.
 */
export function useSectionData<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<SectionState<T>>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setState({ status: "loading" })
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data })
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Something went wrong",
          })
        }
      })

    return () => {
      cancelled = true
    }
    // Intentionally only re-runs on an explicit retry() — `fetcher` is a
    // fresh closure every render, and including it would refetch on every
    // parent re-render instead of once per mount/retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  return { state, retry }
}
