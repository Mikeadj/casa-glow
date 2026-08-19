import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from './config'
import type { ActivityEntry, WeekStartDay } from '../types'
import { startOfWeek } from '../lib/date'

/** Streams completed-task activity since this calendar week started (local
 * time) — resets then, not on a rolling 7-day window. `weekStartDay` picks
 * whether that reset lands on Sunday or Monday, per household preference. */
export function subscribeWeeklyActivity(
  householdId: string,
  weekStartDay: WeekStartDay,
  callback: (entries: ActivityEntry[]) => void,
) {
  const q = query(
    collection(db, 'households', householdId, 'activity'),
    where('completedAt', '>=', startOfWeek(Date.now(), weekStartDay)),
    orderBy('completedAt', 'desc'),
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityEntry))
  })
}
