import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { db } from './config'
import type { CheckIn } from '../types'

export function subscribeCheckIns(
  householdId: string,
  date: string,
  callback: (checkIns: Record<string, CheckIn>) => void,
) {
  const q = query(collection(db, 'households', householdId, 'checkins'), where('date', '==', date))
  return onSnapshot(q, (snap) => {
    const byUid: Record<string, CheckIn> = {}
    snap.docs.forEach((d) => {
      const data = d.data() as CheckIn
      byUid[data.uid] = data
    })
    callback(byUid)
  })
}

export async function setCheckIn(
  householdId: string,
  uid: string,
  date: string,
  energyLevel: CheckIn['energyLevel'],
  availableMinutes: number,
): Promise<void> {
  await setDoc(doc(db, 'households', householdId, 'checkins', `${uid}_${date}`), {
    uid,
    date,
    energyLevel,
    availableMinutes,
    submittedAt: Date.now(),
  } satisfies CheckIn)
}
