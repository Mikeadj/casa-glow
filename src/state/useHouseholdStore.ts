import { create } from 'zustand'
import type { Household, Member } from '../types'
import { subscribeHousehold, subscribeMembers } from '../firebase/households'

interface HouseholdState {
  household: Household | null
  members: Member[]
  loading: boolean
  unsubscribeHousehold: (() => void) | null
  unsubscribeMembers: (() => void) | null
  load: (householdId: string) => Promise<void>
  reset: () => void
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  household: null,
  members: [],
  loading: true,
  unsubscribeHousehold: null,
  unsubscribeMembers: null,

  load: async (householdId: string) => {
    get().unsubscribeHousehold?.()
    get().unsubscribeMembers?.()
    set({ loading: true })

    const unsubscribeHousehold = subscribeHousehold(householdId, (household) => {
      set({ household, loading: false })
    })
    const unsubscribeMembers = subscribeMembers(householdId, (members) => {
      set({ members })
    })

    set({ unsubscribeHousehold, unsubscribeMembers })
  },

  reset: () => {
    get().unsubscribeHousehold?.()
    get().unsubscribeMembers?.()
    set({
      household: null,
      members: [],
      loading: true,
      unsubscribeHousehold: null,
      unsubscribeMembers: null,
    })
  },
}))
