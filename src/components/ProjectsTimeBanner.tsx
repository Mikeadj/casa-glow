import { Link } from 'react-router-dom'
import type { Project, Task } from '../types'
import { overallProjectProgress, totalProjectMinutesLeft } from '../lib/projects'
import { formatMinutes } from '../lib/date'
import PixelEmoji from './PixelEmoji'
import ProgressBar from './ProgressBar'

/** Time remaining on special projects, kept in its own space rather than
 * folded into the house-clean total — projects aren't chores. */
export default function ProjectsTimeBanner({
  tasks,
  projects,
}: {
  tasks: Task[]
  projects: Project[]
}) {
  const active = projects.filter((p) => p.status === 'active')
  if (active.length === 0) return null

  const minutes = totalProjectMinutesLeft(tasks, projects)
  const { done, total } = overallProjectProgress(tasks, projects)

  return (
    <Link
      to="/projects"
      className="block rounded-2xl border border-brass-600/40 bg-brass-600/10 p-5 space-y-3 hover:bg-brass-600/15 transition-colors"
    >
      <div className="flex items-center gap-3">
        <PixelEmoji emoji="⭐" size={28} resolution={7} />
        <div>
          <p className="text-ink-100 font-medium">
            ~{formatMinutes(minutes)} left across your special projects
          </p>
          <p className="text-xs text-ink-500">
            {active.length} project{active.length === 1 ? '' : 's'} in progress
            {total > 0 && ` · ${done}/${total} steps done`}
          </p>
        </div>
      </div>
      {total > 0 && <ProgressBar fraction={done / total} color="var(--color-brass-500)" />}
    </Link>
  )
}
