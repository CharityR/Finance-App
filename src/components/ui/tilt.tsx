"use client"

import { useRef, useState, type CSSProperties } from "react"

import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

const MAX_TILT_DEG = 6

/**
 * Wraps a card-shaped child with a subtle pointer-tracked 3D tilt + glare.
 * Disabled automatically on touch/coarse-pointer devices (no hover to drive
 * it) and when the user has requested reduced motion, so it never costs
 * anything on a phone or for someone who's opted out of motion.
 */
export function Tilt({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)")
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const enabled = isFinePointer && !reducedMotion
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>({})
  const [glareStyle, setGlareStyle] = useState<CSSProperties>({ opacity: 0 })

  if (!enabled) {
    return <div className={className}>{children}</div>
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rotateY = (px - 0.5) * MAX_TILT_DEG * 2
    const rotateX = (0.5 - py) * MAX_TILT_DEG * 2
    setTiltStyle({
      transform: `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    })
    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(160px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.22), transparent 70%)`,
    })
  }

  function handleMouseLeave() {
    setTiltStyle({
      transform: "perspective(700px) rotateX(0deg) rotateY(0deg)",
    })
    setGlareStyle((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={cn(
        "relative isolate rounded-xl transition-transform duration-150 ease-out will-change-transform",
        className
      )}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-150"
        style={glareStyle}
      />
    </div>
  )
}
