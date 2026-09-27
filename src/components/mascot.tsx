import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { trackMascot, type MascotDirection } from "@/lib/mascot-tracking"

const DIRECTIONS = [
  "up-left",
  "up",
  "up-right",
  "left",
  "center",
  "right",
  "down-left",
  "down",
  "down-right",
] as const

const REACTIONS = [
  "blink",
  "heart",
  "sparkle",
  "surprised",
  "wink",
  "bashful",
  "sleepy",
  "dizzy",
  "delighted",
] as const

type Direction = MascotDirection
type Reaction = (typeof REACTIONS)[number]

const PAYOFFS: Reaction[] = ["heart", "sparkle", "delighted"]
const BOOP_PAYOFF = 120
const BOOP_END = 560
const SQUASH_MS = 420
const DIZZY_AFTER = 4
const DIZZY_WINDOW = 1600
const DIZZY_END = 1100

const SQUASH: Keyframe[] = [
  { transform: "scale(1, 1)", easing: "ease-in" },
  { transform: "scale(1.10, 0.86)", offset: 0.18, easing: "ease-out" },
  { transform: "scale(0.95, 1.08)", offset: 0.45, easing: "ease-in-out" },
  { transform: "scale(1.03, 0.97)", offset: 0.72, easing: "ease-in-out" },
  { transform: "scale(1, 1)" },
]

// background-size 300% makes each cell a clean 0/50/100% step on both axes.
function cell(index: number): CSSProperties {
  return {
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
  }
}

const layer: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "300% 300%",
  backgroundRepeat: "no-repeat",
  // Compensate for the atlas padding so the visible cat is centered in its slot.
  transform: "translateY(10%) scale(1.12)",
  transformOrigin: "50% 50%",
}

export type MascotProps = {
  /** The 3x3 sheet of head directions. A served path, or an imported image. */
  directions: string
  /** The 3x3 sheet of expressions. */
  reactions: string
  size?: number
  className?: string
  /** What a screen reader calls it. */
  label?: string
  /** Keep the eyes closed while sensitive information is visible. */
  sleeping?: boolean
}

export function Mascot(props: MascotProps) {
  const {
    directions,
    reactions,
    size = 140,
    className,
    label = "mascot",
    sleeping = false,
  } = props

  const buttonRef = useRef<HTMLButtonElement>(null)
  const squashRef = useRef<HTMLSpanElement>(null)
  const timersRef = useRef<number[]>([])
  const boopsRef = useRef({ count: 0, at: 0 })
  const [direction, setDirection] = useState<Direction>("center")
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const activeReaction = sleeping ? "sleepy" : reaction

  useEffect(() => {
    if (
      sleeping ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return
    }

    let sector = -1
    let pointer: { x: number; y: number } | null = null

    const aim = () => {
      const button = buttonRef.current
      if (!button || !pointer) {
        return
      }

      const tracking = trackMascot(
        pointer,
        button.getBoundingClientRect(),
        sector
      )
      sector = tracking.sector
      setDirection(tracking.direction)
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      aim()
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("scroll", aim, { passive: true })

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("scroll", aim)
    }
  }, [sleeping])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout)
    }
  }, [])

  const boop = () => {
    if (sleeping) return
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []

    const later = (ms: number, next: Reaction | null) => {
      timersRef.current.push(window.setTimeout(() => setReaction(next), ms))
    }

    const now = Date.now()
    const boops = boopsRef.current
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1
    boops.at = now

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0
      setReaction("dizzy")
      later(DIZZY_END, null)
    } else {
      setReaction("blink")
      later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length])
      later(BOOP_END, null)
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    // Per-keyframe easing with the effect itself linear: an easing on the effect
    // would reinterpret every offset and front-load the whole bounce.
    squashRef.current?.animate(SQUASH, {
      duration: SQUASH_MS,
      easing: "linear",
    })
  }

  // Inline styles so the file drops into any project without a CSS framework.
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={boop}
      disabled={sleeping}
      aria-label={sleeping ? `${label} is sleeping` : `Boop the ${label}`}
      className={className}
      style={{
        position: "relative",
        display: "block",
        flexShrink: 0,
        width: size,
        height: size,
        padding: 0,
        border: 0,
        background: "transparent",
        appearance: "none",
        cursor: sleeping ? "default" : "pointer",
        userSelect: "none",
      }}
    >
      <span
        ref={squashRef}
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          height: "100%",
          transformOrigin: "50% 78%",
        }}
      >
        <span
          style={{
            ...layer,
            backgroundImage: `url(${directions})`,
            ...cell(DIRECTIONS.indexOf(direction)),
            opacity: activeReaction ? 0 : 1,
          }}
        />
        {/* Always mounted so the sheet is fetched up front, never on the first click. */}
        <span
          style={{
            ...layer,
            backgroundImage: `url(${reactions})`,
            ...cell(REACTIONS.indexOf(activeReaction ?? "blink")),
            opacity: activeReaction ? 1 : 0,
          }}
        />
      </span>
    </button>
  )
}
