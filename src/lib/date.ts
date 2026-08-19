import type { WeekStartDay } from '../types'

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

export const CHECK_IN_FRESH_MS = 5 * 60 * 60 * 1000 // check-ins reset after 5h

export function isCheckInFresh(submittedAt: number, now: number = Date.now()): boolean {
  return now - submittedAt < CHECK_IN_FRESH_MS
}

export function isToday(timestamp: number, now: number = Date.now()): boolean {
  return dateKey(new Date(timestamp)) === dateKey(new Date(now))
}

/** Midnight at the start of the current calendar week, local time —
 * "this week" resets then, not on a rolling 7-day trailing window.
 * `startDay` picks whether the week begins Sunday or Monday. */
export function startOfWeek(now: number = Date.now(), startDay: WeekStartDay = 'sunday'): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const dayOfWeek = d.getDay() // 0 = Sunday .. 6 = Saturday
  const offset = startDay === 'monday' ? (dayOfWeek + 6) % 7 : dayOfWeek
  d.setDate(d.getDate() - offset)
  return d.getTime()
}

export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - timestamp)
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
