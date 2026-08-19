import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityEntry, CheckIn, Member, Project, Room, Task } from '../types'
import { actionableTasks, isOnDemand, isTaskDirty, wasCleanedToday } from '../lib/dirty'
import { assignDailyTasks } from '../lib/assignment'
import { minutesCompletedToday } from '../lib/activity'
import { formatMinutes, isToday, todayKey } from '../lib/date'
import { motivationalQuote } from '../lib/quotes'
import {
  applyAssignments,
  markTaskClean,
  markTaskDone,
  reassignTask,
  snoozeTask,
  unassignTask,
} from '../firebase/tasks'
import { setProjectStatus } from '../firebase/projects'
import { DEFAULT_PROJECT_ICON, willCompleteProject } from '../lib/projects'
import EnergyBolts from './EnergyBolts'
import EnergyBattery from './EnergyBattery'
import ProgressBar from './ProgressBar'
import ConfirmDialog from './ConfirmDialog'
import { playCoinSound, playFanfareSound } from '../lib/sound'

const WATCHOUT_THRESHOLD = 3

interface Props {
  householdId: string
  uid: string
  tasks: Task[]
  members: Member[]
  rooms: Room[]
  projects: Project[]
  activity: ActivityEntry[]
  checkIns: Record<string, CheckIn>
}

export default function AssignmentBoard({
  householdId,
  uid,
  tasks,
  members,
  rooms,
  projects,
  activity,
  checkIns,
}: Props) {
  const [assigning, setAssigning] = useState(false)
  // Same-session guard against a rapid double-click outrunning Firestore's
  // echo of a just-written lastCleanedAt — see RoomTaskPanel for the twin.
  const [locallyMarkedAt, setLocallyMarkedAt] = useState<Record<string, number>>({})
  const [confirmTask, setConfirmTask] = useState<Task | null>(null)
  const today = todayKey()
  const roomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? 'Unknown room'
  const groupLabel = (task: Task) =>
    task.projectId
      ? (projects.find((p) => p.id === task.projectId)?.name ?? 'Special project')
      : roomName(task.roomId!)
  const taskIcon = (task: Task) =>
    task.projectId
      ? (projects.find((p) => p.id === task.projectId)?.icon ?? DEFAULT_PROJECT_ICON)
      : null

  const projectPriority = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.priority])),
    [projects],
  )

  function completeTask(task: Task) {
    const isRecurring = !task.projectId && !isOnDemand(task)
    if (isRecurring && !isTaskDirty(task)) {
      const alreadyCleanedToday =
        wasCleanedToday(task) ||
        (locallyMarkedAt[task.id] != null && isToday(locallyMarkedAt[task.id]))
      if (alreadyCleanedToday) {
        setConfirmTask(task)
        return
      }
    }
    doCompleteTask(task)
  }

  async function doCompleteTask(task: Task) {
    playCoinSound()
    if (task.projectId) {
      const finishesProject = willCompleteProject(tasks, task.projectId, task.id)
      await markTaskDone(householdId, task, uid)
      if (finishesProject) {
        await setProjectStatus(householdId, task.projectId, 'done')
        playFanfareSound()
      }
      return
    }
    if (isOnDemand(task)) {
      await markTaskDone(householdId, task, uid)
      return
    }
    setLocallyMarkedAt((prev) => ({ ...prev, [task.id]: Date.now() }))
    await markTaskClean(householdId, task, uid)
  }

  const dirty = actionableTasks(tasks)
  const assignedToday = dirty.filter((t) => t.assignedTo && t.assignedDate === today)
  const unassigned = dirty.filter((t) => !(t.assignedTo && t.assignedDate === today))

  const checkedInMembers = members.filter((m) => checkIns[m.uid])
  const isCheckedIn = Boolean(checkIns[uid])

  const roomOwners = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.assignedMemberUid])),
    [rooms],
  )

  const myTasks = assignedToday.filter((t) => t.assignedTo === uid)

  // How much of today's available time this member has already spent,
  // whether or not the task they did was one of the suggested ones — used
  // to shrink the budget for new suggestions instead of over-offering.
  const mySpentToday = minutesCompletedToday(activity, uid)
  const myAssignedMinutes = myTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const myAvailableMinutes = checkIns[uid]?.availableMinutes ?? 0
  const myRemainingBudget = Math.max(0, myAvailableMinutes - mySpentToday - myAssignedMinutes)
  const usedAllTimeToday = isCheckedIn && mySpentToday > 0 && myRemainingBudget <= 0

  // Celebrate finishing a batch: fires once when the user's assigned list
  // drops from non-empty to empty, and resets if they pick up new tasks.
  const prevMyTaskCount = useRef(myTasks.length)
  const [justFinished, setJustFinished] = useState(false)
  const quote = useMemo(() => motivationalQuote(`${uid}-${today}`), [uid, today])
  useEffect(() => {
    if (prevMyTaskCount.current > 0 && myTasks.length === 0) {
      setJustFinished(true)
    } else if (myTasks.length > 0) {
      setJustFinished(false)
    }
    prevMyTaskCount.current = myTasks.length
  }, [myTasks.length])

  // Whenever the current user (re)submits a check-in, or completes something
  // (suggested or not) that shrinks their remaining time, their previous
  // suggestions no longer reflect reality — clear them and recompute fresh
  // against the new budget, instead of leaving stale ones assigned or
  // continuing to offer more once today's time is spent.
  const mySubmittedAt = checkIns[uid]?.submittedAt
  const skipNextAutoAssign = useRef(true)
  useEffect(() => {
    if (skipNextAutoAssign.current) {
      skipNextAutoAssign.current = false
      return
    }
    if (!mySubmittedAt) return

    ;(async () => {
      const myCurrent = assignedToday.filter((t) => t.assignedTo === uid)
      await Promise.all(myCurrent.map((t) => unassignTask(householdId, t.id)))
      const pool = [...unassigned, ...myCurrent]
      const assignments = assignDailyTasks(
        pool,
        [
          {
            uid,
            energyLevel: checkIns[uid].energyLevel,
            availableMinutes: Math.max(0, checkIns[uid].availableMinutes - mySpentToday),
          },
        ],
        roomOwners,
        Date.now(),
        projectPriority,
      )
      await applyAssignments(householdId, assignments, today)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySubmittedAt, mySpentToday])

  async function handleAssign() {
    if (checkedInMembers.length === 0) return
    setAssigning(true)
    try {
      const assignments = assignDailyTasks(
        unassigned,
        checkedInMembers.map((m) => {
          const alreadyCommitted = assignedToday
            .filter((t) => t.assignedTo === m.uid)
            .reduce((sum, t) => sum + t.estimatedMinutes, 0)
          const spentToday = minutesCompletedToday(activity, m.uid)
          return {
            uid: m.uid,
            energyLevel: checkIns[m.uid].energyLevel,
            availableMinutes: Math.max(
              0,
              checkIns[m.uid].availableMinutes - alreadyCommitted - spentToday,
            ),
          }
        }),
        roomOwners,
        Date.now(),
        projectPriority,
      )
      await applyAssignments(householdId, assignments, today)
    } finally {
      setAssigning(false)
    }
  }

  if (dirty.length === 0 && !justFinished) return null

  const othersWithTasks = members.filter(
    (m) => m.uid !== uid && assignedToday.some((t) => t.assignedTo === m.uid),
  )

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5 space-y-4">
      {justFinished && myTasks.length === 0 && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-calm-600/15 border border-calm-600/40 px-3 py-2.5">
          <p className="text-sm text-calm-300">{quote}</p>
          <button
            onClick={() => setJustFinished(false)}
            className="text-xs text-ink-500 hover:text-ink-300 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {dirty.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-500 uppercase tracking-wide">
              Your tasks today, matched to your energy and time
            </p>
            {unassigned.length > 0 && (
              <button
                onClick={handleAssign}
                disabled={assigning || checkedInMembers.length === 0}
                className="text-xs rounded-lg bg-calm-600 hover:bg-calm-700 disabled:opacity-40 text-white px-3 py-1.5 transition-colors"
                title={
                  checkedInMembers.length === 0 ? 'Wait for someone to check in first' : undefined
                }
              >
                {assigning ? 'Assigning…' : 'Suggest tasks'}
              </button>
            )}
          </div>

          {isCheckedIn && myAvailableMinutes > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-ink-500">
                <span>Today's time used</span>
                <span>
                  {formatMinutes(mySpentToday)} / {formatMinutes(myAvailableMinutes)}
                </span>
              </div>
              <ProgressBar
                fraction={mySpentToday / myAvailableMinutes}
                color={usedAllTimeToday ? 'var(--color-calm-500)' : 'var(--color-brass-500)'}
              />
            </div>
          )}

          {myTasks.length > WATCHOUT_THRESHOLD && (
            <div className="flex items-center gap-2 rounded-lg bg-dirty-700/10 border border-dirty-700/40 px-3 py-2">
              <EnergyBattery level={1} size={22} />
              <p className="text-xs text-dirty-300">
                {myTasks.length} tasks lined up — that's a lot in one sitting. Consider pacing
                yourself so you don't run your energy all the way down.
              </p>
            </div>
          )}

          {myTasks.length === 0 && (
            <p className="text-sm text-ink-500">
              {!isCheckedIn
                ? 'Check in above and a task list that fits your energy and time will show up here automatically.'
                : usedAllTimeToday
                  ? "You've used all the time you set aside today — nice work. More will be suggested after tomorrow's check-in."
                  : "Nothing fits your current energy and time right now — you're covered."}
            </p>
          )}

          {myTasks.length > 0 && (
            <ul className="space-y-1.5">
              {myTasks.map((task) => (
                <TaskAssignmentRow
                  key={task.id}
                  task={task}
                  groupLabel={groupLabel(task)}
                  icon={taskIcon(task)}
                  members={members}
                  onMarkClean={() => completeTask(task)}
                  onReassign={(newUid) =>
                    newUid
                      ? reassignTask(householdId, task.id, newUid, today)
                      : unassignTask(householdId, task.id)
                  }
                  onSnooze={() => snoozeTask(householdId, task.id, 1)}
                  showMarkClean
                />
              ))}
            </ul>
          )}

          {othersWithTasks.map((member) => (
            <div key={member.uid}>
              <p className="text-xs text-ink-400 flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }} />
                {member.displayName}
              </p>
              <ul className="space-y-1.5">
                {assignedToday
                  .filter((t) => t.assignedTo === member.uid)
                  .map((task) => (
                    <TaskAssignmentRow
                      key={task.id}
                      task={task}
                      groupLabel={groupLabel(task)}
                      icon={taskIcon(task)}
                      members={members}
                      onMarkClean={() => {}}
                      onReassign={(newUid) =>
                        newUid
                          ? reassignTask(householdId, task.id, newUid, today)
                          : unassignTask(householdId, task.id)
                      }
                      onSnooze={() => {}}
                      showMarkClean={false}
                    />
                  ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {confirmTask && (
        <ConfirmDialog
          message={`You've already marked "${confirmTask.name}" as clean today — mark it again?`}
          confirmLabel="Mark clean again"
          onConfirm={() => {
            doCompleteTask(confirmTask)
            setConfirmTask(null)
          }}
          onCancel={() => setConfirmTask(null)}
        />
      )}
    </div>
  )
}

function TaskAssignmentRow({
  task,
  groupLabel,
  icon,
  members,
  onMarkClean,
  onReassign,
  onSnooze,
  showMarkClean,
}: {
  task: Task
  groupLabel: string
  icon: string | null
  members: Member[]
  onMarkClean: () => void
  onReassign: (uid: string) => void
  onSnooze: () => void
  showMarkClean: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-ink-800 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm text-ink-100 truncate">
          {icon && <span className="text-brass-400">{icon} </span>}
          {task.name}
        </p>
        <p className="text-[11px] text-ink-500 flex items-center gap-1">
          {groupLabel} · <EnergyBolts count={task.energyPoints} /> · {task.estimatedMinutes}m
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showMarkClean && (
          <button onClick={onMarkClean} className="text-xs text-calm-300 hover:text-calm-100">
            {isOnDemand(task) ? 'Do it' : 'Mark clean'}
          </button>
        )}
        {showMarkClean && !isOnDemand(task) && (
          <button onClick={onSnooze} className="text-xs text-ink-500 hover:text-ink-300">
            Snooze 1d
          </button>
        )}
        <select
          value={task.assignedTo ?? ''}
          onChange={(e) => onReassign(e.target.value)}
          className="text-[11px] bg-ink-900 border border-ink-700 rounded-md px-1.5 py-1 text-ink-300"
        >
          {members.map((m) => (
            <option key={m.uid} value={m.uid}>
              {m.displayName}
            </option>
          ))}
          <option value="">Unassign</option>
        </select>
      </div>
    </li>
  )
}
