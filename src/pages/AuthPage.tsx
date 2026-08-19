import { useState, type FormEvent } from 'react'
import { signIn, signUp } from '../firebase/auth'
import PixelEmoji from '../components/PixelEmoji'

export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'sign-up') {
        await signUp(email, password, displayName)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? humanizeAuthError(err.message) : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <PixelEmoji emoji="🌟" size={44} resolution={8} />
          </div>
          <h1 className="text-2xl font-semibold text-ink-100">Casa Glow</h1>
          <p className="text-ink-300 text-sm mt-1">Keep the house calm, together.</p>
        </div>

        <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6 shadow-xl">
          <div className="flex mb-6 bg-ink-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('sign-in')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'sign-in' ? 'bg-calm-600 text-white' : 'text-ink-300'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('sign-up')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'sign-up' ? 'bg-calm-600 text-white' : 'text-ink-300'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'sign-up' && (
              <input
                type="text"
                required
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500"
            />

            {error && <p className="text-dirty-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-calm-600 hover:bg-calm-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
            >
              {busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function humanizeAuthError(message: string): string {
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
    return 'Incorrect email or password.'
  }
  if (message.includes('auth/email-already-in-use')) {
    return 'An account already exists with that email.'
  }
  if (message.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters.'
  }
  if (message.includes('auth/invalid-email')) {
    return 'That email address looks invalid.'
  }
  return 'Something went wrong. Please try again.'
}
