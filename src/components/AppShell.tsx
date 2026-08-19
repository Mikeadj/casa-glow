import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { signOutUser } from '../firebase/auth'
import { useSession } from '../state/useSession'
import { CURRENT_RELEASE, LATEST_RELEASE_NOTES } from '../lib/whatsNew'
import PixelEmoji from './PixelEmoji'
import WhatsNewModal from './WhatsNewModal'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🌤️', end: true },
  { to: '/floor-plan', label: 'Floor Plan', icon: '🏠', end: false },
  { to: '/projects', label: 'Projects', icon: '⭐', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

const LAST_SEEN_RELEASE_KEY = 'casaglow-last-seen-release'

export default function AppShell() {
  const user = useSession((s) => s.user)
  const [showWhatsNew, setShowWhatsNew] = useState(
    () => localStorage.getItem(LAST_SEEN_RELEASE_KEY) !== CURRENT_RELEASE,
  )

  function dismissWhatsNew() {
    localStorage.setItem(LAST_SEEN_RELEASE_KEY, CURRENT_RELEASE)
    setShowWhatsNew(false)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-56 shrink-0 border-r border-ink-800 bg-ink-900/60 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2">
          <PixelEmoji emoji="🌟" size={28} resolution={7} />
          <span className="font-semibold text-ink-100">Casa Glow</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-calm-600/20 text-calm-300'
                    : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
                }`
              }
            >
              <PixelEmoji emoji={item.icon} size={18} resolution={6} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-ink-800">
          <div className="px-3 py-2 text-xs text-ink-500 truncate">
            {user?.displayName || user?.email}
          </div>
          <button
            onClick={() => signOutUser()}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-ink-300 hover:bg-ink-800 hover:text-dirty-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>

      {showWhatsNew && <WhatsNewModal notes={LATEST_RELEASE_NOTES} onDismiss={dismissWhatsNew} />}
    </div>
  )
}
