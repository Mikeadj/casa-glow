import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, firebaseConfigured } from './firebase/config'
import { getUserHousehold } from './firebase/users'
import { useSession } from './state/useSession'
import { useHouseholdStore } from './state/useHouseholdStore'
import AuthPage from './pages/AuthPage'
import HouseholdSetupPage from './pages/HouseholdSetupPage'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import FloorPlanPage from './pages/FloorPlanPage'
import ProjectsPage from './pages/ProjectsPage'
import SettingsPage from './pages/SettingsPage'
import ConfigWarning from './components/ConfigWarning'

export default function App() {
  const { user, authLoading, householdId, setUser, setAuthLoading, setHouseholdId } =
    useSession()
  const loadHousehold = useHouseholdStore((s) => s.load)
  const resetHousehold = useHouseholdStore((s) => s.reset)

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false)
      return
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const id = await getUserHousehold(firebaseUser.uid)
        setHouseholdId(id)
      } else {
        setHouseholdId(null)
        resetHousehold()
      }
      setAuthLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (householdId) loadHousehold(householdId)
  }, [householdId, loadHousehold])

  if (!firebaseConfigured) return <ConfigWarning />

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-500 text-sm">
        Loading…
      </div>
    )
  }

  if (!user) return <AuthPage />
  if (!householdId) return <HouseholdSetupPage />

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/floor-plan" element={<FloorPlanPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
