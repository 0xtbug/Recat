export type MascotDirection =
  | "center"
  | "right"
  | "down-right"
  | "down"
  | "down-left"
  | "left"
  | "up-left"
  | "up"
  | "up-right"

const clockwise: MascotDirection[] = [
  "right",
  "down-right",
  "down",
  "down-left",
  "left",
  "up-left",
  "up",
  "up-right",
]
const sectorAngle = (Math.PI * 2) / clockwise.length
const hysteresis = 0.12

export function trackMascot(
  pointer: { x: number; y: number },
  box: { left: number; top: number; width: number; height: number },
  previousSector = -1
): { direction: MascotDirection; sector: number } {
  const dx = pointer.x - (box.left + box.width / 2)
  const dy = pointer.y - (box.top + box.height / 2)
  // Keep the neutral area small enough for a mascot placed near a viewport edge.
  const deadZone = Math.max(4, Math.min(box.width, box.height) * 0.12)
  if (Math.hypot(dx, dy) < deadZone) return { direction: "center", sector: -1 }
  const angle = Math.atan2(dy, dx)
  const difference = angle - previousSector * sectorAngle
  if (
    previousSector !== -1 &&
    Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference))) <
      sectorAngle / 2 + hysteresis
  ) {
    return { direction: clockwise[previousSector], sector: previousSector }
  }
  const sector =
    (Math.round(angle / sectorAngle) + clockwise.length) % clockwise.length
  return { direction: clockwise[sector], sector }
}
