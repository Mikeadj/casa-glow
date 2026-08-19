import type { Project, ProjectPriority, Task } from '../types'

export const PROJECT_PRIORITY_ORDER: ProjectPriority[] = [
  'urgent',
  'high',
  'medium',
  'low',
  'someday',
]

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  someday: 'Someday',
}

// Reuses the same 0..1 scale as taskDirtiness/roomFillColor so a project's
// urgency glows along the identical calm-green -> dirty-red gradient as
// everything else in the app, instead of introducing a second color language.
export const PROJECT_PRIORITY_WEIGHT: Record<ProjectPriority, number> = {
  someday: 0.05,
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  urgent: 0.95,
}

export const DEFAULT_PROJECT_ICON = '⭐'

// A quick-pick starting point — the field itself accepts any emoji, this
// just saves a trip to the OS picker for common project shapes.
export const PROJECT_ICON_PRESETS = [
  '⭐',
  '🏗️',
  '🛠️',
  '🌱',
  '🏋️',
  '🎨',
  '🔨',
  '🚗',
  '🪴',
  '🧱',
  '📦',
  '🐶',
]

export function projectStepsFor(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId)
}

export function projectProgress(
  tasks: Task[],
  projectId: string,
): { done: number; total: number } {
  const steps = projectStepsFor(tasks, projectId)
  return { done: steps.filter((t) => t.completedAt != null).length, total: steps.length }
}

/** Remaining (not-yet-done) minutes across one project's steps. */
export function projectMinutesLeft(tasks: Task[], projectId: string): number {
  return projectStepsFor(tasks, projectId)
    .filter((t) => t.completedAt == null)
    .reduce((sum, t) => sum + t.estimatedMinutes, 0)
}

/** Remaining minutes across every active project — the dashboard's
 * "time left on special projects" figure, kept separate from house-clean time. */
export function totalProjectMinutesLeft(tasks: Task[], projects: Project[]): number {
  return projects
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + projectMinutesLeft(tasks, p.id), 0)
}

/** Steps done vs total across every active project combined — the
 * household-wide progress bar for the dashboard's projects banner. */
export function overallProjectProgress(
  tasks: Task[],
  projects: Project[],
): { done: number; total: number } {
  return projects
    .filter((p) => p.status === 'active')
    .reduce(
      (acc, p) => {
        const { done, total } = projectProgress(tasks, p.id)
        return { done: acc.done + done, total: acc.total + total }
      },
      { done: 0, total: 0 },
    )
}

/** True when completing `justCompletedTaskId` would leave every step of the
 * project done — used to auto-close a project the moment its last step is
 * checked off, before the completion write has round-tripped back down. */
export function willCompleteProject(
  tasks: Task[],
  projectId: string,
  justCompletedTaskId: string,
): boolean {
  const steps = projectStepsFor(tasks, projectId)
  if (steps.length === 0) return false
  return steps.every((t) => t.completedAt != null || t.id === justCompletedTaskId)
}

export function sortByPriority(projects: Project[]): Project[] {
  return projects
    .slice()
    .sort(
      (a, b) =>
        PROJECT_PRIORITY_ORDER.indexOf(a.priority) - PROJECT_PRIORITY_ORDER.indexOf(b.priority),
    )
}
