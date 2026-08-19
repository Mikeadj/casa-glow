import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'
import type { Room, RoomType } from '../types'

export function subscribeRooms(householdId: string, callback: (rooms: Room[]) => void) {
  return onSnapshot(collection(db, 'households', householdId, 'rooms'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room))
  })
}

export async function addRoom(
  householdId: string,
  room: Omit<Room, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'households', householdId, 'rooms'), room)
  return ref.id
}

export async function updateRoomLayout(
  householdId: string,
  roomId: string,
  layout: Partial<Pick<Room, 'x' | 'y' | 'width' | 'height'>>,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'rooms', roomId), layout)
}

export async function renameRoom(
  householdId: string,
  roomId: string,
  name: string,
  type: RoomType,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'rooms', roomId), { name, type })
}

/** Restricts (or lifts the restriction on) which member this room's tasks
 * get auto-assigned to — null means anyone checked in is eligible. */
export async function setRoomAssignedMember(
  householdId: string,
  roomId: string,
  assignedMemberUid: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'rooms', roomId), { assignedMemberUid })
}

export async function deleteRoom(householdId: string, roomId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'rooms', roomId))
}
