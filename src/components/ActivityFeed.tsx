import type { ActivityEntry, Member, Project, Room } from '../types'
import { timeAgo } from '../lib/date'
import { useNow } from '../state/useNow'

interface Props {
  entries: ActivityEntry[]
  members: Member[]
  rooms: Room[]
  projects: Project[]
}

export default function ActivityFeed({ entries, members, rooms, projects }: Props) {
  const now = useNow()
  const recent = entries.slice(0, 20)

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
      <p className="text-xs text-ink-500 uppercase tracking-wide mb-3">Recent activity</p>

      {recent.length === 0 && (
        <p className="text-sm text-ink-500">
          Nothing logged yet — completed tasks will show up here as everyone chips in.
        </p>
      )}

      {recent.length > 0 && (
        <ul className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {recent.map((entry) => {
            const member = members.find((m) => m.uid === entry.uid)
            const groupLabel = entry.projectId
              ? `${projects.find((p) => p.id === entry.projectId)?.name ?? 'Unknown project'} (project)`
              : (rooms.find((r) => r.id === entry.roomId)?.name ?? 'Unknown room')
            return (
              <li key={entry.id} className="flex items-start gap-2 text-sm">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: member?.color ?? 'var(--color-ink-500)' }}
                />
                <p className="min-w-0 text-ink-300">
                  <span className="text-ink-100 font-medium">
                    {member?.displayName ?? 'Someone'}
                  </span>{' '}
                  cleaned <span className="text-ink-100">{entry.taskName}</span>
                  <span className="text-ink-500"> · {groupLabel}</span>
                </p>
                <span className="text-[11px] text-ink-500 shrink-0 whitespace-nowrap">
                  {timeAgo(entry.completedAt, now)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
