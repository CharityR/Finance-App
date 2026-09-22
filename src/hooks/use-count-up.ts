"use client"

import { useEffect, useRef, useState } from "react"

import { useMediaQuery } from "@/hooks/use-media-query"

/**
 * Animates from the previously-settled value to `target` whenever it
 * changes, starting from 0 on first mount (a deliberate "reveal" on first
 * paint rather than an instant jump). Returns `target` directly, bypassing
 * the animation loop entirely, when the user has requested reduced motion.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const hasSettledRef = useRef(false)

  useEffect(() => {
    if (reducedMotion) return

    const from = hasSettledRef.current ? fromRef.current : 0
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
        hasSettledRef.current = true
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs, reducedMotion])

  return reducedMotion ? target : value
}
