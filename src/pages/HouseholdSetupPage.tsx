import { useState, type FormEvent } from 'react'
import { createHousehold, joinHouseholdByCode } from '../firebase/households'
import { useSession } from '../state/useSession'
import PixelEmoji from '../components/PixelEmoji'

export default function HouseholdSetupPage() {
  const user = useSession((s) => s.user)
  const setHouseholdId = useSession((s) => s.setHouseholdId)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setBusy(true)
    try {
      const displayName = user.displayName || user.email || 'Someone'
      const id =
        mode === 'create'
          ? await createHousehold(name.trim(), user.uid, displayName)
          : await joinHouseholdByCode(code, user.uid, displayName)
      setHouseholdId(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <PixelEmoji emoji="🏠" size={44} resolution={8} />
          </div>
          <h1 className="text-2xl font-semibold text-ink-100">Set up your household</h1>
          <p className="text-ink-300 text-sm mt-1">
            Start a new household or join one with an invite code.
          </p>
        </div>

        <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6 shadow-xl">
          <div className="flex mb-6 bg-ink-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'create' ? 'bg-calm-600 text-white' : 'text-ink-300'
              }`}
            >
              Create new
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'join' ? 'bg-calm-600 text-white' : 'text-ink-300'
              }`}
            >
              Join existing
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'create' ? (
              <input
                type="text"
                required
                placeholder="Household name (e.g. The Smiths)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500"
              />
            ) : (
              <input
                type="text"
                required
                placeholder="Invite code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500 tracking-widest uppercase"
              />
            )}

            {error && <p className="text-dirty-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-calm-600 hover:bg-calm-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
            >
              {busy ? 'Please wait…' : mode === 'create' ? 'Create household' : 'Join household'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
