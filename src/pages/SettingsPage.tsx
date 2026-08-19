import { useState } from 'react'
import { useHouseholdStore } from '../state/useHouseholdStore'
import { setWeekStartDay } from '../firebase/households'
import type { WeekStartDay } from '../types'

export default function SettingsPage() {
  const household = useHouseholdStore((s) => s.household)
  const members = useHouseholdStore((s) => s.members)
  const [copied, setCopied] = useState(false)

  function copyCode() {
    if (!household) return
    navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-100">Settings</h1>
        <p className="text-ink-300 text-sm mt-1">Manage your household and members.</p>
      </div>

      <section className="bg-ink-900 border border-ink-700 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-ink-300 mb-3">Household</h2>
        <p className="text-lg text-ink-100 font-medium">{household?.name}</p>

        <div className="mt-4">
          <p className="text-xs text-ink-500 mb-1.5">
            Invite code — share this so others can join
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg tracking-[0.3em] bg-ink-800 border border-ink-700 rounded-lg px-4 py-2 text-calm-300">
              {household?.inviteCode}
            </span>
            <button
              onClick={copyCode}
              className="rounded-lg border border-ink-700 px-3 py-2 text-xs text-ink-300 hover:bg-ink-800 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-ink-500 mb-1.5">
            "This week" resets on
          </p>
          <div className="flex bg-ink-800 rounded-lg p-0.5 w-fit">
            {(['sunday', 'monday'] as WeekStartDay[]).map((day) => (
              <button
                key={day}
                onClick={() => household && setWeekStartDay(household.id, day)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  household?.weekStartDay === day
                    ? 'bg-calm-600 text-white'
                    : 'text-ink-400 hover:text-ink-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-900 border border-ink-700 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-ink-300 mb-3">Members</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.uid}
              className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span className="text-sm text-ink-100">{m.displayName}</span>
              </div>
              <span className="text-xs text-ink-500">{m.points} pts</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
