import type { ProjectPriority, Task } from '../types'
import { taskDirtiness } from './dirty'
import { PROJECT_PRIORITY_WEIGHT } from './projects'

export interface AssignmentCandidate {
  uid: string
  energyLevel: 1 | 2 | 3 | 4 | 5
  availableMinutes: number
}

export interface Assignment {
  taskId: string
  uid: string
}

// Your energy level is a hard ceiling: a task's energyPoints must not
// exceed it, so someone at 2/5 never gets handed a 3+ effort task.
function energyCap(level: number): number {
  return level
}

// Project steps aren't part of the dirty/clean cycle (taskDirtiness is
// always 0 for them), so they'd never compete for a suggestion slot without
// their own signal — the owning project's priority stands in for urgency,
// on the same 0..1 scale as dirtiness so the two sort together sensibly.
function taskUrgency(
  task: Task,
  projectPriority: Record<string, ProjectPriority>,
  now: number,
): number {
  if (task.projectId) return PROJECT_PRIORITY_WEIGHT[projectPriority[task.projectId] ?? 'medium']
  return taskDirtiness(task, now)
}

/**
 * Greedily distributes today's actionable tasks (overdue recurring tasks
 * plus any on-demand to-dos, including special-project steps — the caller
 * decides what's eligible) across checked-in members, most-urgent first
 * with on-demand tasks trailing behind actual mess, round-robin so everyone
 * gets a mix rather than one person's budget being drained before the next
 * person gets a turn. Skips tasks nobody currently has the time or matched
 * energy for.
 *
 * `roomOwners` maps a roomId to the one member allowed to receive its
 * tasks — everyone else is skipped for that task entirely, so a
 * member-restricted room never gets auto-assigned to the wrong person.
 * `projectPriority` maps a projectId to its priority, used to rank project
 * steps against each other and against recurring chores.
 */
export function assignDailyTasks(
  tasks: Task[],
  members: AssignmentCandidate[],
  roomOwners: Record<string, string | null> = {},
  now: number = Date.now(),
  projectPriority: Record<string, ProjectPriority> = {},
): Assignment[] {
  const remaining = tasks
    .slice()
    .sort((a, b) => taskUrgency(b, projectPriority, now) - taskUrgency(a, projectPriority, now))

  const budgets = new Map(members.map((m) => [m.uid, m.availableMinutes]))
  const assignments: Assignment[] = []

  let progress = true
  while (progress && remaining.length > 0) {
    progress = false
    for (const member of members) {
      const budget = budgets.get(member.uid) ?? 0
      if (budget <= 0) continue
      const cap = energyCap(member.energyLevel)
      const idx = remaining.findIndex((t) => {
        const owner = t.roomId ? roomOwners[t.roomId] : undefined
        if (owner && owner !== member.uid) return false
        return t.energyPoints <= cap && t.estimatedMinutes <= budget
      })
      if (idx === -1) continue
      const [task] = remaining.splice(idx, 1)
      assignments.push({ taskId: task.id, uid: member.uid })
      budgets.set(member.uid, budget - task.estimatedMinutes)
      progress = true
    }
  }

  return assignments
}
