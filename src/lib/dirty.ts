import type { Task } from '../types'
import { isToday } from './date'

const DAY_MS = 24 * 60 * 60 * 1000

export function isOnDemand(task: Task): boolean {
  return task.recurrenceDays === null
}

/** True when a seasonal task's active window covers the current month
 * (year-round for tasks with no seasonal range set). Handles a range that
 * wraps the year boundary, e.g. Nov -> Feb covers Nov/Dec/Jan/Feb.
 * Uses loose null checks since tasks created before this field existed
 * have it missing (undefined) from Firestore, not explicitly null. */
export function isInSeason(task: Task, now: number = Date.now()): boolean {
  const { seasonalStartMonth: start, seasonalEndMonth: end } = task
  if (start == null || end == null) return true
  const month = new Date(now).getMonth() + 1
  if (start <= end) return month >= start && month <= end
  return month >= start || month <= end
}

/** Recurring tasks that are actually part of the active dirty/clean cycle
 * right now — excludes seasonal tasks outside their window. */
export function isTaskActive(task: Task, now: number = Date.now()): boolean {
  return !isOnDemand(task) && isInSeason(task, now)
}

/** True when a recurring task was already marked clean earlier today —
 * used to confirm before letting it be marked clean a second time, since
 * that's almost always an accidental double-click rather than intentional. */
export function wasCleanedToday(task: Task, now: number = Date.now()): boolean {
  return task.lastCleanedAt != null && isToday(task.lastCleanedAt, now)
}

export function isTaskDirty(task: Task, now: number = Date.now()): boolean {
  if (!isTaskActive(task, now)) return false
  if (task.snoozedUntil && task.snoozedUntil > now) return false
  if (task.manuallyDirty) return true
  if (task.lastCleanedAt === null) return true
  return now - task.lastCleanedAt >= task.recurrenceDays! * DAY_MS
}

/**
 * Continuous 0..1 signal for room coloring: eases up to 0.5 as a task
 * approaches its due date, crosses to "dirty" at 0.5, then climbs toward 1
 * the more overdue it is (capped at 2x the recurrence window).
 * On-demand tasks never contribute dirtiness — they're not part of the
 * clean/dirty cycle.
 */
export function taskDirtiness(task: Task, now: number = Date.now()): number {
  if (!isTaskActive(task, now)) return 0
  if (task.snoozedUntil && task.snoozedUntil > now) return 0
  if (task.manuallyDirty) return 1
  if (task.lastCleanedAt === null) return 1

  const windowMs = task.recurrenceDays! * DAY_MS
  const elapsedMs = now - task.lastCleanedAt
  const ratio = elapsedMs / windowMs

  if (ratio < 1) return Math.max(0, ratio) * 0.45
  return 0.5 + Math.min(0.5, (ratio - 1) * 0.5)
}

/**
 * Averages every recurring task's dirtiness (on-demand tasks are excluded
 * entirely, not just zeroed, so a room full of one-off to-dos doesn't read
 * as artificially cleaner) rather than taking the worst one, so a room
 * where most things are done reads as yellow (partial credit) instead of
 * jumping straight to red for a single overdue task.
 */
export function roomDirtiness(tasks: Task[], now: number = Date.now()): number {
  const recurring = tasks.filter((t) => isTaskActive(t, now))
  if (recurring.length === 0) return 0
  const sum = recurring.reduce((acc, t) => acc + taskDirtiness(t, now), 0)
  return sum / recurring.length
}

export function dirtyTasks(tasks: Task[], now: number = Date.now()): Task[] {
  return tasks.filter((t) => isTaskDirty(t, now))
}

/**
 * Tasks whose dirtiness has climbed into the orange/red end of the same
 * color scale used for room tiles and task dots — not just barely yellow
 * the moment they became due. This is the basis for the "time to clean"
 * estimate, so it only flags things that would actually read as urgent.
 */
export function overdueTasks(
  tasks: Task[],
  thresholdDirtiness: number = 0.7,
  now: number = Date.now(),
): Task[] {
  return tasks.filter((t) => taskDirtiness(t, now) >= thresholdDirtiness)
}

/** On-demand tasks still worth doing — excludes completed project steps,
 * which stay in Firestore as checked-off history instead of being deleted. */
export function onDemandTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => isOnDemand(t) && t.completedAt == null)
}

/** Everything actionable today: overdue recurring tasks plus any on-demand
 * to-dos, since both are fair game for check-in-based suggestions. */
export function actionableTasks(tasks: Task[], now: number = Date.now()): Task[] {
  return [...dirtyTasks(tasks, now), ...onDemandTasks(tasks)]
}

export function totalCleanMinutes(tasks: Task[], now: number = Date.now()): number {
  return dirtyTasks(tasks, now).reduce((sum, t) => sum + t.estimatedMinutes, 0)
}
