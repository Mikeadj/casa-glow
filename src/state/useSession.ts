import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface SessionState {
  user: User | null
  authLoading: boolean
  householdId: string | null
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void
  setHouseholdId: (id: string | null) => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  authLoading: true,
  householdId: null,
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setHouseholdId: (householdId) => set({ householdId }),
}))
