import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './config'

export async function setUserHousehold(uid: string, householdId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { householdId }, { merge: true })
}

export async function getUserHousehold(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data().householdId ?? null
}
