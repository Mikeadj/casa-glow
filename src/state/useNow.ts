import { useEffect, useState } from 'react'

/** A timestamp that re-renders consumers periodically, so time-based
 * conditions (like check-in expiry) update even without new data arriving. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
