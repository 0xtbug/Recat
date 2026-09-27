import { expect, test } from "bun:test"
import { trackMascot } from "../src/lib/mascot-tracking"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Mascot } from "../src/components/mascot"

const box = { left: 18, top: 8, width: 72, height: 72 }

test("a small sidebar mascot follows the mouse above and left of it instead of staying centered", () => {
  expect(trackMascot({ x: 0, y: 44 }, box).direction).toBe("left")
  expect(trackMascot({ x: 54, y: 0 }, box).direction).toBe("up")
  expect(trackMascot({ x: 0, y: 0 }, box).direction).toBe("up-left")
})

test("tracking covers the complete circle and returns to center near the mascot", () => {
  const directions = [
    "right",
    "down-right",
    "down",
    "down-left",
    "left",
    "up-left",
    "up",
    "up-right",
  ]
  for (const [sector, direction] of directions.entries()) {
    const angle = (sector * Math.PI) / 4
    const pointer = {
      x: 54 + 20 * Math.cos(angle),
      y: 44 + 20 * Math.sin(angle),
    }
    expect(trackMascot(pointer, box).direction).toBe(direction)
  }
  expect(trackMascot({ x: 55, y: 45 }, box)).toEqual({
    direction: "center",
    sector: -1,
  })
})

test("tiny movements at a sector edge do not flicker, but crossing it changes direction", () => {
  const pointerAt = (angle: number) => ({
    x: 54 + 200 * Math.cos(angle),
    y: 44 + 200 * Math.sin(angle),
  })
  expect(trackMascot(pointerAt(Math.PI / 8 + 0.03), box, 0).direction).toBe(
    "right"
  )
  expect(trackMascot(pointerAt(Math.PI / 8 + 0.2), box, 0).direction).toBe(
    "down-right"
  )
})

test("the near-pointer threshold scales with the rendered mascot size", () => {
  const large = { left: 0, top: 0, width: 140, height: 140 }
  expect(trackMascot({ x: 70, y: 50 }, large).direction).toBe("up")
  expect(trackMascot({ x: 70, y: 69 }, large).direction).toBe("center")
})

test("moving far to the right replaces any previous upward pose with right", () => {
  for (let previousSector = -1; previousSector < 8; previousSector++) {
    expect(trackMascot({ x: 1800, y: 80 }, box, previousSector).direction).toBe(
      "right"
    )
  }
})

test("password visibility still forces the sleeping expression and disables boops", () => {
  const markup = renderToStaticMarkup(
    createElement(Mascot, {
      directions: "/mascots/cybersec-orange-lens-directions.webp",
      reactions: "/mascots/cybersec-orange-lens-reactions.webp",
      sleeping: true,
    })
  )
  expect(markup).toContain('disabled=""')
  expect(markup).toContain('aria-label="mascot is sleeping"')
  expect(markup).toContain("background-position:0% 100%;opacity:1")
})
