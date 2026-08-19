let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/** Classic 8-bit "coin get" chime — two quick square-wave notes, synthesized
 * live (no audio asset to ship or license). */
export function playCoinSound(): void {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    playNote(ctx, 988, now, 0.09) // B5
    playNote(ctx, 1319, now + 0.09, 0.22) // E6
  } catch {
    // Audio is a nice-to-have — never let it block marking a task clean.
  }
}

/** A longer four-note ascending fanfare — for finishing an entire special
 * project, a bigger moment than checking off one step. */
export function playFanfareSound(): void {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    playNote(ctx, 523, now, 0.12) // C5
    playNote(ctx, 659, now + 0.12, 0.12) // E5
    playNote(ctx, 784, now + 0.24, 0.12) // G5
    playNote(ctx, 1047, now + 0.36, 0.4) // C6
  } catch {
    // Audio is a nice-to-have.
  }
}
