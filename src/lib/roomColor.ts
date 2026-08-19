// Maps a room's dirtiness (0 = spotless, 1 = maximally overdue) to a fill
// color along a green -> yellow -> dark red gradient.
const STOPS: Array<[number, [number, number, number]]> = [
  [0, [74, 201, 120]], // clean green
  [0.5, [234, 190, 30]], // yellow — some done / approaching due
  [1, [153, 27, 27]], // dark red — overdue
]

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

export function roomFillColor(dirtiness: number): string {
  const d = Math.max(0, Math.min(1, dirtiness))
  let lo = STOPS[0]
  let hi = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (d >= STOPS[i][0] && d <= STOPS[i + 1][0]) {
      lo = STOPS[i]
      hi = STOPS[i + 1]
      break
    }
  }
  const span = hi[0] - lo[0] || 1
  const t = (d - lo[0]) / span
  const [r, g, b] = [
    lerp(lo[1][0], hi[1][0], t),
    lerp(lo[1][1], hi[1][1], t),
    lerp(lo[1][2], hi[1][2], t),
  ]
  return `rgb(${r}, ${g}, ${b})`
}
