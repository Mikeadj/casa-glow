export type RoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living-room'
  | 'dining-room'
  | 'office'
  | 'laundry'
  | 'hallway'
  | 'gym'
  | 'garage'
  | 'storage'
  | 'yard'
  | 'garden'
  | 'other'

export type WeekStartDay = 'sunday' | 'monday'

export interface Household {
  id: string
  name: string
  inviteCode: string
  createdAt: number
  cleanStreak: number
  lastZeroDirtyDate: string | null
  weekStartDay: WeekStartDay
}

export interface Member {
  uid: string
  displayName: string
  color: string
  points: number
}

export interface Room {
  id: string
  name: string
  type: RoomType
  x: number
  y: number
  width: number
  height: number
  // When set, only this member's tasks get auto-assigned this room's tasks —
  // everyone else is skipped by the scheduler (manual reassignment still works).
  assignedMemberUid: string | null
}

export interface Task {
  id: string
  // Exactly one of roomId / projectId is set: a task belongs to a room's
  // recurring clean/dirty cycle, or to a special project's step checklist.
  roomId: string | null
  projectId: string | null
  name: string
  energyPoints: 1 | 2 | 3 | 4 | 5
  estimatedMinutes: number
  // null means this is an on-demand task: not tracked by the dirty/clean
  // recurrence cycle, just sits available to do whenever. Completing it
  // stamps completedAt (see below) instead of deleting it, so it can be
  // reopened later instead of being gone for good.
  // Project steps are always on-demand (a build step doesn't recur).
  recurrenceDays: number | null
  lastCleanedAt: number | null
  manuallyDirty: boolean
  snoozedUntil: number | null
  assignedTo: string | null
  assignedDate: string | null
  // Both set means the task only re-dirties during that month range
  // (inclusive, e.g. 11 -> 2 covers Nov/Dec/Jan/Feb). Null means year-round.
  seasonalStartMonth: number | null
  seasonalEndMonth: number | null
  // Set once an on-demand task (a room's do-whenever task, or a project
  // step) is done — the doc is kept, not deleted, so it can be reopened.
  // Always null for recurring room tasks.
  completedAt: number | null
}

export interface CheckIn {
  uid: string
  date: string
  energyLevel: 1 | 2 | 3 | 4 | 5
  availableMinutes: number
  submittedAt: number
}

/** One completed task, logged for the weekly activity feed and time-spent chart. */
export interface ActivityEntry {
  id: string
  taskName: string
  roomId: string | null
  projectId: string | null
  uid: string
  minutes: number
  energyPoints: number
  completedAt: number
}

export type ProjectPriority = 'someday' | 'low' | 'medium' | 'high' | 'urgent'

/** A one-off household build/initiative (e.g. "Build garden enclosure") made
 * up of checklist steps, distinct from a room's recurring clean/dirty cycle. */
export interface Project {
  id: string
  name: string
  description: string
  icon: string
  priority: ProjectPriority
  status: 'active' | 'done'
  targetDate: number | null
  createdAt: number
  completedAt: number | null
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  'living-room': 'Living Room',
  'dining-room': 'Dining Room',
  office: 'Office',
  laundry: 'Laundry',
  hallway: 'Hallway',
  gym: 'Gym',
  garage: 'Garage',
  storage: 'Storage',
  yard: 'Yard',
  garden: 'Garden',
  other: 'Other',
}

export const MEMBER_COLORS = [
  '#3fb891', // calm green
  '#4f8cf0', // blue
  '#c084fc', // violet
  '#f6b273', // amber
  '#ef7d3c', // orange
  '#f472b6', // pink
]
