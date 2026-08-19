import { useEffect, useState } from 'react'
import type { Room } from '../types'
import { subscribeRooms } from '../firebase/rooms'

export function useRooms(householdId: string | null): Room[] {
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    if (!householdId) {
      setRooms([])
      return
    }
    return subscribeRooms(householdId, setRooms)
  }, [householdId])

  return rooms
}
