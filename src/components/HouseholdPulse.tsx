import type { CheckIn } from '../types'
import EnergyBattery from './EnergyBattery'

interface Props {
  checkIns: Record<string, CheckIn>
  totalMembers: number
}

/** A single combined read on how the household is doing right now, rather
 * than a per-person breakdown — keeps check-ins collaborative, not compared. */
export default function HouseholdPulse({ checkIns, totalMembers }: Props) {
  const submitted = Object.values(checkIns)
  const checkedInCount = submitted.length

  if (checkedInCount === 0) {
    return (
      <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
        <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Household pulse</p>
        <p className="text-sm text-ink-500 mt-2">No one's checked in yet today.</p>
      </div>
    )
  }

  const avgEnergy = submitted.reduce((sum, c) => sum + c.energyLevel, 0) / checkedInCount
  const totalMinutes = submitted.reduce((sum, c) => sum + c.availableMinutes, 0)

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
      <p className="text-xs text-ink-500 uppercase tracking-wide mb-3">Household pulse</p>
      <div className="flex items-center gap-3">
        <EnergyBattery level={avgEnergy} size={40} />
        <div>
          <p className="text-ink-100 text-sm font-medium">
            {avgEnergy.toFixed(1)}/5 average energy
          </p>
          <p className="text-ink-500 text-xs mt-0.5">
            {totalMinutes}m available together · {checkedInCount}/{totalMembers} checked in
          </p>
        </div>
      </div>
    </div>
  )
}
