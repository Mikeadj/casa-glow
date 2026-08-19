const QUOTES = [
  'Look at that — done and dusted.',
  'Every task counts. Today, you counted.',
  'Small wins add up to a spotless life.',
  "That's a wrap. The house thanks you.",
  'You showed up for your space today.',
  'Progress, not perfection — and you nailed both.',
  'One more day, one cleaner home.',
  'You did the thing. All of it.',
  'Future you says thanks.',
  'Nothing left on your list — nice work.',
  'You turned effort into a cleaner home.',
  'Consistency beats intensity — you are proof.',
  'The house feels lighter because you showed up.',
  'Chores: cleared. Confidence: earned.',
]

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic per seed (e.g. uid + date) so the quote doesn't change on
 * every re-render, just once per completion. */
export function motivationalQuote(seed: string): string {
  return QUOTES[hash(seed) % QUOTES.length]
}
