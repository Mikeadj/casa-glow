import type { ActivityEntry, Room } from '../types'
import { isToday } from './date'

export interface RoomTimeSlice {
  roomId: string
  roomName: string
  minutes: number
}

/**
 * Combined (not per-person) minutes spent this week, grouped by room —
 * the household's effort together, not who did more than whom. Project-step
 * completions (no roomId) are excluded — they get their own space, not
 * folded into the room breakdown.
 */
export function minutesByRoom(entries: ActivityEntry[], rooms: Room[]): RoomTimeSlice[] {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.roomId) continue
    totals.set(entry.roomId, (totals.get(entry.roomId) ?? 0) + entry.minutes)
  }
  return Array.from(totals.entries())
    .map(([roomId, minutes]) => ({
      roomId,
      roomName: rooms.find((r) => r.id === roomId)?.name ?? 'Unknown room',
      minutes,
    }))
    .sort((a, b) => b.minutes - a.minutes)
}

export function totalMinutes(entries: ActivityEntry[]): number {
  return entries.reduce((sum, e) => sum + e.minutes, 0)
}

/** How many minutes this member has already completed today (any task,
 * suggested or not) — used to shrink their remaining suggestion budget. */
export function minutesCompletedToday(
  entries: ActivityEntry[],
  uid: string,
  now: number = Date.now(),
): number {
  return entries
    .filter((e) => e.uid === uid && isToday(e.completedAt, now))
    .reduce((sum, e) => sum + e.minutes, 0)
}
