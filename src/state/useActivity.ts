import { useEffect, useState } from 'react'
import type { ActivityEntry, WeekStartDay } from '../types'
import { subscribeWeeklyActivity } from '../firebase/activity'

export function useWeeklyActivity(
  householdId: string | null,
  weekStartDay: WeekStartDay = 'sunday',
): ActivityEntry[] {
  const [entries, setEntries] = useState<ActivityEntry[]>([])

  useEffect(() => {
    if (!householdId) {
      setEntries([])
      return
    }
    return subscribeWeeklyActivity(householdId, weekStartDay, setEntries)
  }, [householdId, weekStartDay])

  return entries
}
