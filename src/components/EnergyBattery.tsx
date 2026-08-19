import { roomFillColor } from '../lib/roomColor'

interface Props {
  /** 1-5, can be fractional (e.g. a household average). */
  level: number
  size?: number
}

/** A battery gauge standing in for mood/energy — empty and red at 1,
 * full and green at 5 — reusing the app's existing clean(green)/dirty(red)
 * color scale so "low energy" reads the same as "needs attention" elsewhere. */
export default function EnergyBattery({ level, size = 28 }: Props) {
  const clamped = Math.max(1, Math.min(5, level))
  const fraction = clamped / 5
  const color = roomFillColor(1 - (clamped - 1) / 4)
  const width = size
  const height = size * (14 / 26)

  return (
    <svg width={width} height={height} viewBox="0 0 26 14" className="shrink-0">
      <rect
        x={1}
        y={1}
        width={20}
        height={12}
        rx={2.5}
        fill="none"
        stroke="var(--color-ink-300)"
        strokeWidth={1.5}
      />
      <rect x={21.5} y={5} width={2.5} height={4} rx={1} fill="var(--color-ink-300)" />
      <rect x={2.5} y={2.5} width={17 * fraction} height={9} rx={1} fill={color} />
    </svg>
  )
}
