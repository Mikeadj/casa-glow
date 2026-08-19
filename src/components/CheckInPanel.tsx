import { useEffect, useRef, useState } from 'react'
import type { CheckIn } from '../types'
import { setCheckIn } from '../firebase/checkins'
import { todayKey } from '../lib/date'
import EnergyBattery from './EnergyBattery'

interface Props {
  householdId: string
  uid: string
  existing: CheckIn | null
}

export default function CheckInPanel({ householdId, uid, existing }: Props) {
  const [editing, setEditing] = useState(!existing)
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(existing?.energyLevel ?? 3)
  const [availableMinutes, setAvailableMinutes] = useState(existing?.availableMinutes ?? 30)
  const [saving, setSaving] = useState(false)

  // `existing` often arrives async (Firestore subscription resolves after
  // mount), so the useState initializers above can miss it. Sync once the
  // first time real data shows up, without clobbering later in-progress edits.
  const hasSyncedExisting = useRef(false)
  useEffect(() => {
    if (!hasSyncedExisting.current && existing) {
      hasSyncedExisting.current = true
      setEditing(false)
      setEnergyLevel(existing.energyLevel)
      setAvailableMinutes(existing.availableMinutes)
    }
  }, [existing])

  async function handleSubmit() {
    setSaving(true)
    try {
      await setCheckIn(householdId, uid, todayKey(), energyLevel, availableMinutes)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!editing && existing) {
    return (
      <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Today's check-in</p>
          <p className="text-ink-100 flex items-center gap-2">
            <EnergyBattery level={existing.energyLevel} size={24} />
            Energy {existing.energyLevel}/5 · {existing.availableMinutes} min available
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-calm-300 hover:text-calm-100"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5 space-y-4">
      <p className="text-xs text-ink-500 uppercase tracking-wide">How are you feeling today?</p>

      <div className="flex justify-between gap-2">
        {([1, 2, 3, 4, 5] as const).map((level) => (
          <button
            key={level}
            onClick={() => setEnergyLevel(level)}
            className={`flex-1 rounded-xl py-3 flex items-center justify-center transition-all ${
              energyLevel === level
                ? 'bg-calm-600/25 ring-2 ring-calm-500 scale-105'
                : 'bg-ink-800 hover:bg-ink-700'
            }`}
          >
            <EnergyBattery level={level} size={32} />
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-ink-500">How much time do you have? (minutes)</label>
        <input
          type="number"
          min={0}
          step={5}
          value={availableMinutes}
          onChange={(e) => setAvailableMinutes(Number(e.target.value))}
          className="w-full mt-1 rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-calm-500"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-lg bg-calm-600 hover:bg-calm-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
      >
        {saving ? 'Saving…' : "I'm ready"}
      </button>
    </div>
  )
}
