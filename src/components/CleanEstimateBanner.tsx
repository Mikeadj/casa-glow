import { useEffect } from 'react'
import type { Household, Task } from '../types'
import { dirtyTasks, isTaskActive, overdueTasks } from '../lib/dirty'
import { formatMinutes } from '../lib/date'
import { recordFullyCleanIfNeeded } from '../firebase/households'
import PixelEmoji from './PixelEmoji'
import ProgressBar from './ProgressBar'

// Matches "orange or red" on the same color scale the rooms/tasks already
// use, rather than counting a task the moment it turns yellow (just due).
const ORANGE_THRESHOLD = 0.7

export default function CleanEstimateBanner({
  tasks,
  household,
}: {
  tasks: Task[]
  household: Household | null
}) {
  const overdue = overdueTasks(tasks, ORANGE_THRESHOLD)
  const minutes = overdue.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const activeRecurring = tasks.filter((t) => isTaskActive(t))
  const cleanFraction =
    activeRecurring.length > 0 ? 1 - overdue.length / activeRecurring.length : 1

  // The streak still tracks against anything genuinely due (yellow or
  // past), independent of what the banner chooses to surface as urgent.
  const isFullyClean = tasks.length > 0 && dirtyTasks(tasks).length === 0
  useEffect(() => {
    if (isFullyClean && household) {
      recordFullyCleanIfNeeded(household)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullyClean, household?.id])

  if (overdue.length === 0) {
    return (
      <div className="rounded-2xl border border-calm-600/40 bg-calm-600/10 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <PixelEmoji emoji="✨" size={28} resolution={7} />
          <div>
            <p className="text-calm-300 font-medium">
              Everything's clean!
              {household && household.cleanStreak > 0 && (
                <span className="ml-2 text-xs text-ink-400 inline-flex items-center gap-1">
                  <PixelEmoji emoji="🔥" size={13} resolution={5} /> {household.cleanStreak} day
                  {household.cleanStreak === 1 ? '' : 's'} streak
                </span>
              )}
            </p>
            <p className="text-xs text-ink-500">No dirty tasks right now — enjoy it.</p>
          </div>
        </div>
        {activeRecurring.length > 0 && <ProgressBar fraction={1} />}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <PixelEmoji emoji="🧽" size={28} resolution={7} />
        <div>
          <p className="text-ink-100 font-medium">
            ~{formatMinutes(minutes)} to get the whole house clean
          </p>
          <p className="text-xs text-ink-500">
            {overdue.length} task{overdue.length === 1 ? '' : 's'} waiting across the house ·{' '}
            {Math.round(cleanFraction * 100)}% clean
          </p>
        </div>
      </div>
      <ProgressBar fraction={cleanFraction} />
    </div>
  )
}
