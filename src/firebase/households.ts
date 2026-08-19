import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'
import type { Household, Member, WeekStartDay } from '../types'
import { MEMBER_COLORS } from '../types'
import { setUserHousehold } from './users'
import { todayKey, yesterdayKey } from '../lib/date'

function randomInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

// Deterministic-ish pick so co-members are unlikely to collide without
// needing to read the (not-yet-joinable) members list first.
function colorForUid(uid: string): string {
  let hash = 0
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0
  return MEMBER_COLORS[hash % MEMBER_COLORS.length]
}

export async function createHousehold(
  name: string,
  uid: string,
  displayName: string,
): Promise<string> {
  const inviteCode = randomInviteCode()

  const householdRef = await addDoc(collection(db, 'households'), {
    name,
    inviteCode,
    createdAt: serverTimestamp(),
    cleanStreak: 0,
    lastZeroDirtyDate: null,
    weekStartDay: 'sunday',
  })

  // Lookup table so joining doesn't require querying households the user
  // isn't a member of yet (Firestore rules can't scope a `where` query).
  await setDoc(doc(db, 'inviteCodes', inviteCode), { householdId: householdRef.id })

  await setDoc(doc(db, 'households', householdRef.id, 'members', uid), {
    uid,
    displayName,
    color: colorForUid(uid),
    points: 0,
  } satisfies Member)
  await setUserHousehold(uid, householdRef.id)

  return householdRef.id
}

export async function joinHouseholdByCode(
  inviteCode: string,
  uid: string,
  displayName: string,
): Promise<string> {
  const codeSnap = await getDoc(doc(db, 'inviteCodes', inviteCode.trim().toUpperCase()))
  if (!codeSnap.exists()) {
    throw new Error('No household found with that invite code.')
  }
  const householdId = codeSnap.data().householdId as string

  await setDoc(doc(db, 'households', householdId, 'members', uid), {
    uid,
    displayName,
    color: colorForUid(uid),
    points: 0,
  } satisfies Member)
  await setUserHousehold(uid, householdId)

  return householdId
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseHousehold(id: string, data: any): Household {
  return {
    id,
    name: data.name,
    inviteCode: data.inviteCode,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    cleanStreak: data.cleanStreak ?? 0,
    lastZeroDirtyDate: data.lastZeroDirtyDate ?? null,
    weekStartDay: data.weekStartDay ?? 'sunday',
  }
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, 'households', householdId))
  if (!snap.exists()) return null
  return parseHousehold(snap.id, snap.data())
}

/** Live subscription so settings changes (week-start day, clean streak,
 * etc.) reflect immediately instead of waiting for the next full reload. */
export function subscribeHousehold(
  householdId: string,
  callback: (household: Household | null) => void,
) {
  return onSnapshot(doc(db, 'households', householdId), (snap) => {
    callback(snap.exists() ? parseHousehold(snap.id, snap.data()) : null)
  })
}

export async function setWeekStartDay(householdId: string, weekStartDay: WeekStartDay): Promise<void> {
  await updateDoc(doc(db, 'households', householdId), { weekStartDay })
}

/**
 * Bumps the household's "fully clean" streak the first time in a day that a
 * client observes zero dirty tasks. Computed opportunistically client-side
 * (no server cron) — consecutive-day check compares against yesterday's key.
 */
export async function recordFullyCleanIfNeeded(household: Household): Promise<void> {
  const today = todayKey()
  if (household.lastZeroDirtyDate === today) return

  const nextStreak = household.lastZeroDirtyDate === yesterdayKey() ? household.cleanStreak + 1 : 1

  await updateDoc(doc(db, 'households', household.id), {
    cleanStreak: nextStreak,
    lastZeroDirtyDate: today,
  })
}

export function subscribeMembers(
  householdId: string,
  callback: (members: Member[]) => void,
) {
  return onSnapshot(collection(db, 'households', householdId, 'members'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Member))
  })
}
