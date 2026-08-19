// Fun flavor lines shown under rooms/tasks based on dirtiness (0 = spotless,
// 1 = maximally overdue). A few options per tier for variety; picked
// deterministically per id so the line doesn't flicker between renders.
const TIERS: Array<{ max: number; lines: string[] }> = [
  {
    max: 0.15,
    lines: [
      "So clean you can see your reflection.",
      "Spotless — you could eat off this floor.",
      "Sparkling. Not a speck in sight.",
      "Fresh linen and lemon polish energy.",
    ],
  },
  {
    max: 0.4,
    lines: [
      "A light layer of dust is settling in.",
      "Still looking good, just a little dusty.",
      "One more day and the dust bunnies move in.",
      "Holding up well — minor touch-ups needed.",
    ],
  },
  {
    max: 0.6,
    lines: [
      "The dust bunnies are multiplying.",
      "Starting to look a little neglected.",
      "Crumbs are forming a colony.",
      "That smudge isn't going away on its own.",
    ],
  },
  {
    max: 0.85,
    lines: [
      "Grime is settling in for the long haul.",
      "The dust is thick enough to write your name in.",
      "This surface has seen better days.",
      "Sticky spots are becoming permanent residents.",
    ],
  },
  {
    max: 1,
    lines: [
      "Wondering where the flies come from? Here it is.",
      "The fly nest.",
      "This has officially gone feral.",
      "Grime has taken up permanent residence.",
    ],
  },
]

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

export function flavorText(dirtiness: number, seed: string): string {
  const tier = TIERS.find((t) => dirtiness <= t.max) ?? TIERS[TIERS.length - 1]
  const idx = hash(seed) % tier.lines.length
  return tier.lines[idx]
}
