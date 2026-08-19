import { useEffect, useState } from 'react'
import type { CheckIn } from '../types'
import { subscribeCheckIns } from '../firebase/checkins'
import { isCheckInFresh, todayKey } from '../lib/date'
import { useNow } from './useNow'

/** All of today's check-ins, regardless of the 5h freshness window. */
export function useAllTodayCheckIns(householdId: string | null): Record<string, CheckIn> {
  const [checkIns, setCheckIns] = useState<Record<string, CheckIn>>({})

  useEffect(() => {
    if (!householdId) {
      setCheckIns({})
      return
    }
    return subscribeCheckIns(householdId, todayKey(), setCheckIns)
  }, [householdId])

  return checkIns
}

/** Only returns check-ins submitted within the last 5h — older ones are
 * treated as expired so people re-check-in as their day changes. Governs
 * who's "actively" checked in for today's assignment; the day's aggregate
 * energy stat uses useAllTodayCheckIns instead, since that should keep
 * reflecting everyone who checked in today even after this window lapses. */
export function useTodayCheckIns(householdId: string | null): Record<string, CheckIn> {
  const checkIns = useAllTodayCheckIns(householdId)
  const now = useNow()

  const fresh: Record<string, CheckIn> = {}
  for (const [uid, checkIn] of Object.entries(checkIns)) {
    if (isCheckInFresh(checkIn.submittedAt, now)) fresh[uid] = checkIn
  }
  return fresh
}
