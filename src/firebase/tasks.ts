import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import type { ActivityEntry, Task } from '../types'
import type { TaskTemplate } from '../lib/taskTemplates'
import type { Assignment } from '../lib/assignment'

export function subscribeTasks(householdId: string, callback: (tasks: Task[]) => void) {
  return onSnapshot(collection(db, 'households', householdId, 'tasks'), (snap) => {
    callback(
      snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          // Tasks created before the Special Projects fields existed are
          // missing them entirely (undefined, not null) — normalize here so
          // nothing downstream (esp. Firestore writes, which reject
          // `undefined`) ever has to special-case old vs. new docs.
          projectId: data.projectId ?? null,
          completedAt: data.completedAt ?? null,
        } as Task
      }),
    )
  })
}

export async function addTask(
  householdId: string,
  roomId: string,
  fields: Omit<
    Task,
    | 'id'
    | 'roomId'
    | 'projectId'
    | 'lastCleanedAt'
    | 'manuallyDirty'
    | 'snoozedUntil'
    | 'assignedTo'
    | 'assignedDate'
    | 'completedAt'
  >,
): Promise<string> {
  const ref = await addDoc(collection(db, 'households', householdId, 'tasks'), {
    roomId,
    projectId: null,
    ...fields,
    lastCleanedAt: Date.now(),
    manuallyDirty: false,
    snoozedUntil: null,
    assignedTo: null,
    assignedDate: null,
    completedAt: null,
  })
  return ref.id
}

/** Adds a checklist step to a special project. Steps are always on-demand
 * (no recurrence) and live outside the room clean/dirty cycle entirely. */
export async function addProjectTask(
  householdId: string,
  projectId: string,
  fields: { name: string; energyPoints: 1 | 2 | 3 | 4 | 5; estimatedMinutes: number },
): Promise<string> {
  const ref = await addDoc(collection(db, 'households', householdId, 'tasks'), {
    roomId: null,
    projectId,
    name: fields.name,
    energyPoints: fields.energyPoints,
    estimatedMinutes: fields.estimatedMinutes,
    recurrenceDays: null,
    lastCleanedAt: null,
    manuallyDirty: false,
    snoozedUntil: null,
    assignedTo: null,
    assignedDate: null,
    seasonalStartMonth: null,
    seasonalEndMonth: null,
    completedAt: null,
  })
  return ref.id
}

/** Seeds a room's suggested default tasks in one batch, all starting clean. */
export async function addTaskTemplates(
  householdId: string,
  roomId: string,
  templates: TaskTemplate[],
): Promise<void> {
  const batch = writeBatch(db)
  const now = Date.now()
  for (const t of templates) {
    const ref = doc(collection(db, 'households', householdId, 'tasks'))
    batch.set(ref, {
      roomId,
      projectId: null,
      name: t.name,
      energyPoints: t.energyPoints,
      estimatedMinutes: t.estimatedMinutes,
      recurrenceDays: t.recurrenceDays,
      lastCleanedAt: now,
      manuallyDirty: false,
      snoozedUntil: null,
      assignedTo: null,
      assignedDate: null,
      seasonalStartMonth: null,
      seasonalEndMonth: null,
      completedAt: null,
    })
  }
  await batch.commit()
}

export async function updateTask(
  householdId: string,
  taskId: string,
  fields: Partial<
    Pick<
      Task,
      | 'name'
      | 'energyPoints'
      | 'estimatedMinutes'
      | 'recurrenceDays'
      | 'seasonalStartMonth'
      | 'seasonalEndMonth'
    >
  >,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'tasks', taskId), fields)
}

export async function deleteTask(householdId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'tasks', taskId))
}

export async function markTaskDirty(householdId: string, taskId: string): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'tasks', taskId), {
    manuallyDirty: true,
    snoozedUntil: null,
  })
}

export async function snoozeTask(
  householdId: string,
  taskId: string,
  days: number,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'tasks', taskId), {
    snoozedUntil: Date.now() + days * 24 * 60 * 60 * 1000,
    manuallyDirty: false,
  })
}

/** Writes the day's computed task -> member assignments in one batch. */
export async function applyAssignments(
  householdId: string,
  assignments: Assignment[],
  date: string,
): Promise<void> {
  const batch = writeBatch(db)
  for (const a of assignments) {
    batch.update(doc(db, 'households', householdId, 'tasks', a.taskId), {
      assignedTo: a.uid,
      assignedDate: date,
    })
  }
  await batch.commit()
}

export async function reassignTask(
  householdId: string,
  taskId: string,
  uid: string,
  date: string,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'tasks', taskId), {
    assignedTo: uid,
    assignedDate: date,
  })
}

export async function unassignTask(householdId: string, taskId: string): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'tasks', taskId), {
    assignedTo: null,
    assignedDate: null,
  })
}

/** Marks a task clean, awards its energy points to the member who did it, and
 * logs it to the activity feed used by the weekly chart and feed. */
export async function markTaskClean(
  householdId: string,
  task: Task,
  uid: string,
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'households', householdId, 'tasks', task.id), {
    lastCleanedAt: Date.now(),
    manuallyDirty: false,
    snoozedUntil: null,
    assignedTo: null,
    assignedDate: null,
  })
  batch.update(doc(db, 'households', householdId, 'members', uid), {
    points: increment(task.energyPoints),
  })
  logActivity(batch, householdId, task, uid)
  await batch.commit()
}

/** Completes any on-demand task (a room's do-whenever task, or a special-
 * project step): awards points, logs it, and stamps completedAt instead of
 * deleting, so it sits done until reopened — nothing that's marked done
 * disappears for good. */
export async function markTaskDone(householdId: string, task: Task, uid: string): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'households', householdId, 'tasks', task.id), {
    completedAt: Date.now(),
    assignedTo: null,
    assignedDate: null,
  })
  batch.update(doc(db, 'households', householdId, 'members', uid), {
    points: increment(task.energyPoints),
  })
  logActivity(batch, householdId, task, uid)
  await batch.commit()
}

/** Brings a done on-demand task back to "needs doing" — used both when a
 * project step gets unchecked and when a room's on-demand task is needed
 * again later. */
export async function reopenTask(householdId: string, taskId: string): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'tasks', taskId), { completedAt: null })
}

function logActivity(
  batch: ReturnType<typeof writeBatch>,
  householdId: string,
  task: Task,
  uid: string,
): void {
  const ref = doc(collection(db, 'households', householdId, 'activity'))
  batch.set(ref, {
    taskName: task.name,
    roomId: task.roomId,
    projectId: task.projectId,
    uid,
    minutes: task.estimatedMinutes,
    energyPoints: task.energyPoints,
    completedAt: Date.now(),
  } satisfies Omit<ActivityEntry, 'id'>)
}
