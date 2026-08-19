import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Room, Task } from '../types'
import { TASK_TEMPLATES } from '../lib/taskTemplates'
import { isInSeason, isOnDemand, isTaskDirty, taskDirtiness, wasCleanedToday } from '../lib/dirty'
import { isToday } from '../lib/date'
import { flavorText } from '../lib/flavorText'
import { roomFillColor } from '../lib/roomColor'
import EnergyBolts from './EnergyBolts'
import ConfirmDialog from './ConfirmDialog'
import {
  addTask,
  addTaskTemplates,
  deleteTask,
  markTaskClean,
  markTaskDirty,
  markTaskDone,
  reopenTask,
  snoozeTask,
  updateTask,
} from '../firebase/tasks'
import { playCoinSound } from '../lib/sound'

interface Props {
  room: Room
  tasks: Task[]
  householdId: string
  uid: string
}

interface TaskFields {
  name: string
  energyPoints: 1 | 2 | 3 | 4 | 5
  estimatedMinutes: number
  recurrenceDays: number | null
  seasonalStartMonth: number | null
  seasonalEndMonth: number | null
}

type RecurrenceUnit = 'days' | 'weeks' | 'months'
const DAYS_PER_WEEK = 7
const DAYS_PER_MONTH = 30

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// Recurrence is always stored in days; this only picks a friendlier unit to
// show when an existing task's interval happens to be a whole number of
// weeks or months.
function recurrenceToDisplay(days: number): { value: number; unit: RecurrenceUnit } {
  if (days >= DAYS_PER_MONTH && days % DAYS_PER_MONTH === 0) {
    return { value: days / DAYS_PER_MONTH, unit: 'months' }
  }
  if (days >= DAYS_PER_WEEK && days % DAYS_PER_WEEK === 0) {
    return { value: days / DAYS_PER_WEEK, unit: 'weeks' }
  }
  return { value: days, unit: 'days' }
}

function formatRecurrence(days: number): string {
  const { value, unit } = recurrenceToDisplay(days)
  if (unit === 'months') return `${value}mo`
  if (unit === 'weeks') return `${value}w`
  return `${value}d`
}

export default function RoomTaskPanel({ room, tasks, householdId, uid }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  // Firestore's echo of a just-written lastCleanedAt takes a round-trip to
  // arrive, so wasCleanedToday() alone misses a rapid double-click on the
  // same button — this fills that gap until the real data catches up.
  const [locallyMarkedAt, setLocallyMarkedAt] = useState<Record<string, number>>({})
  const [confirmTask, setConfirmTask] = useState<Task | null>(null)
  const now = Date.now()

  const recurringTasks = tasks.filter((t) => !isOnDemand(t))
  const onDemand = tasks.filter(isOnDemand)

  async function handleSeedTemplates() {
    await addTaskTemplates(householdId, room.id, TASK_TEMPLATES[room.type])
  }

  function doMarkClean(task: Task) {
    playCoinSound()
    setLocallyMarkedAt((prev) => ({ ...prev, [task.id]: Date.now() }))
    markTaskClean(householdId, task, uid)
  }

  function handleMarkClean(task: Task) {
    // A task that's currently dirty again (recurred, or manually marked
    // dirty) is always a legitimate clean regardless of same-day history —
    // only warn when re-marking something that isn't actually due.
    const currentlyDirty = isTaskDirty(task, now)
    const alreadyCleanedToday =
      !currentlyDirty &&
      (wasCleanedToday(task, now) ||
        (locallyMarkedAt[task.id] != null && isToday(locallyMarkedAt[task.id], now)))
    if (alreadyCleanedToday) {
      setConfirmTask(task)
      return
    }
    doMarkClean(task)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-ink-300 uppercase tracking-wide">Tasks</h3>
        <button
          onClick={() => {
            setEditingTaskId(null)
            setShowAddForm((v) => !v)
          }}
          className="text-xs text-calm-300 hover:text-calm-100"
        >
          {showAddForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {tasks.length === 0 && !showAddForm && (
        <div className="text-xs text-ink-500 space-y-2">
          <p>No tasks yet for this room.</p>
          {TASK_TEMPLATES[room.type]?.length > 0 && (
            <button
              onClick={handleSeedTemplates}
              className="w-full rounded-lg border border-calm-600 text-calm-300 text-xs py-2 hover:bg-calm-600/10 transition-colors"
            >
              Use suggested tasks
            </button>
          )}
        </div>
      )}

      {showAddForm && (
        <TaskFieldsForm
          submitLabel="Add task"
          onSubmit={async (fields) => {
            await addTask(householdId, room.id, fields)
            setShowAddForm(false)
          }}
        />
      )}

      <ul className="space-y-2">
        {recurringTasks.map((task) =>
          editingTaskId === task.id ? (
            <li key={task.id} className="rounded-lg bg-ink-800 p-3">
              <TaskFieldsForm
                initial={task}
                submitLabel="Save"
                onSubmit={async (fields) => {
                  await updateTask(householdId, task.id, fields)
                  setEditingTaskId(null)
                }}
                onCancel={() => setEditingTaskId(null)}
              />
            </li>
          ) : (
            <TaskRow
              key={task.id}
              task={task}
              dirty={isTaskDirty(task, now)}
              onMarkClean={() => handleMarkClean(task)}
              onMarkDirty={() => markTaskDirty(householdId, task.id)}
              onSnooze={() => snoozeTask(householdId, task.id, 1)}
              onEdit={() => {
                setShowAddForm(false)
                setEditingTaskId(task.id)
              }}
              onDelete={() => deleteTask(householdId, task.id)}
            />
          ),
        )}
      </ul>

      {onDemand.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-ink-300 uppercase tracking-wide">
            On-demand — do whenever
          </h4>
          <ul className="space-y-2">
            {onDemand.map((task) =>
              editingTaskId === task.id ? (
                <li key={task.id} className="rounded-lg bg-ink-800 p-3">
                  <TaskFieldsForm
                    initial={task}
                    submitLabel="Save"
                    onSubmit={async (fields) => {
                      await updateTask(householdId, task.id, fields)
                      setEditingTaskId(null)
                    }}
                    onCancel={() => setEditingTaskId(null)}
                  />
                </li>
              ) : (
                <OnDemandTaskRow
                  key={task.id}
                  task={task}
                  onComplete={() => {
                    playCoinSound()
                    markTaskDone(householdId, task, uid)
                  }}
                  onReopen={() => reopenTask(householdId, task.id)}
                  onEdit={() => {
                    setShowAddForm(false)
                    setEditingTaskId(task.id)
                  }}
                  onDelete={() => deleteTask(householdId, task.id)}
                />
              ),
            )}
          </ul>
        </div>
      )}

      {confirmTask && (
        <ConfirmDialog
          message={`You've already marked "${confirmTask.name}" as clean today — mark it again?`}
          confirmLabel="Mark clean again"
          onConfirm={() => {
            doMarkClean(confirmTask)
            setConfirmTask(null)
          }}
          onCancel={() => setConfirmTask(null)}
        />
      )}
    </div>
  )
}

function TaskRow({
  task,
  dirty,
  onMarkClean,
  onMarkDirty,
  onSnooze,
  onEdit,
  onDelete,
}: {
  task: Task
  dirty: boolean
  onMarkClean: () => void
  onMarkDirty: () => void
  onSnooze: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const offSeason = !isInSeason(task)

  return (
    <li className="rounded-lg bg-ink-800 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onEdit}
          className="min-w-0 text-left hover:opacity-80 transition-opacity"
          title="Edit task"
        >
          <p className="text-sm text-ink-100 truncate">{task.name}</p>
          <p className="text-[11px] text-ink-500 flex items-center gap-1">
            <EnergyBolts count={task.energyPoints} /> · {task.estimatedMinutes}m · every{' '}
            {formatRecurrence(task.recurrenceDays!)}
            {task.seasonalStartMonth != null && task.seasonalEndMonth != null && (
              <span>
                {' '}
                · {MONTH_NAMES[task.seasonalStartMonth - 1]}–{MONTH_NAMES[task.seasonalEndMonth - 1]}
              </span>
            )}
          </p>
          <p className="text-[11px] text-ink-400 italic mt-0.5">
            {offSeason
              ? 'Off-season — sits out until its window comes back around.'
              : flavorText(taskDirtiness(task), task.id)}
          </p>
        </button>
        <span
          className="shrink-0 w-2 h-2 rounded-full"
          style={{ backgroundColor: offSeason ? 'var(--color-ink-500)' : roomFillColor(taskDirtiness(task)) }}
          title={
            offSeason
              ? 'Off-season'
              : `${Math.round(taskDirtiness(task) * 100)}% of the way to due`
          }
        />
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px]">
        {!offSeason && (
          <button onClick={onMarkClean} className="text-calm-300 hover:text-calm-100">
            Mark clean
          </button>
        )}
        {!offSeason && (
          <button onClick={onMarkDirty} className="text-dirty-500 hover:text-dirty-300">
            Mark dirty
          </button>
        )}
        {!offSeason && !dirty && (
          <button onClick={onSnooze} className="text-ink-500 hover:text-ink-300">
            Snooze 1d
          </button>
        )}
        <button onClick={onEdit} className="text-ink-500 hover:text-ink-300">
          Edit
        </button>
        <button onClick={onDelete} className="ml-auto text-ink-500 hover:text-dirty-500">
          Delete
        </button>
      </div>
    </li>
  )
}

function OnDemandTaskRow({
  task,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}: {
  task: Task
  onComplete: () => void
  onReopen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const done = task.completedAt != null

  return (
    <li className="rounded-lg bg-ink-800 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onEdit}
          className="min-w-0 text-left hover:opacity-80 transition-opacity"
          title="Edit task"
        >
          <p className={`text-sm truncate ${done ? 'text-ink-500 line-through' : 'text-ink-100'}`}>
            {task.name}
          </p>
          <p className="text-[11px] text-ink-500 flex items-center gap-1">
            <EnergyBolts count={task.energyPoints} /> · {task.estimatedMinutes}m ·{' '}
            {done ? 'done for now' : 'whenever'}
          </p>
        </button>
        <span
          className={`shrink-0 w-2 h-2 rounded-full ${done ? 'bg-calm-500' : 'bg-ink-500'}`}
          title="On-demand"
        />
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px]">
        {done ? (
          <button onClick={onReopen} className="text-calm-300 hover:text-calm-100">
            Needed again
          </button>
        ) : (
          <button onClick={onComplete} className="text-calm-300 hover:text-calm-100">
            Do it
          </button>
        )}
        <button onClick={onEdit} className="text-ink-500 hover:text-ink-300">
          Edit
        </button>
        <button onClick={onDelete} className="ml-auto text-ink-500 hover:text-dirty-500">
          Delete
        </button>
      </div>
    </li>
  )
}

function TaskFieldsForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: TaskFields
  submitLabel: string
  onSubmit: (fields: TaskFields) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [energyPoints, setEnergyPoints] = useState<1 | 2 | 3 | 4 | 5>(initial?.energyPoints ?? 2)
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes ?? 10)
  const [onDemandMode, setOnDemandMode] = useState(
    initial ? initial.recurrenceDays === null : false,
  )
  const initialRecurrence = recurrenceToDisplay(initial?.recurrenceDays ?? 3)
  const [recurrenceValue, setRecurrenceValue] = useState(initialRecurrence.value)
  const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceUnit>(initialRecurrence.unit)
  const [seasonal, setSeasonal] = useState(
    initial ? initial.seasonalStartMonth != null && initial.seasonalEndMonth != null : false,
  )
  const [seasonalStartMonth, setSeasonalStartMonth] = useState(initial?.seasonalStartMonth ?? 3)
  const [seasonalEndMonth, setSeasonalEndMonth] = useState(initial?.seasonalEndMonth ?? 9)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const recurrenceDays = onDemandMode
      ? null
      : recurrenceUnit === 'months'
        ? recurrenceValue * DAYS_PER_MONTH
        : recurrenceUnit === 'weeks'
          ? recurrenceValue * DAYS_PER_WEEK
          : recurrenceValue
    onSubmit({
      name: name.trim(),
      energyPoints,
      estimatedMinutes,
      recurrenceDays,
      seasonalStartMonth: !onDemandMode && seasonal ? seasonalStartMonth : null,
      seasonalEndMonth: !onDemandMode && seasonal ? seasonalEndMonth : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-ink-800 p-3 space-y-2">
      <input
        autoFocus
        type="text"
        required
        placeholder="Task name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md bg-ink-900 border border-ink-700 px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500"
      />

      <div className="flex bg-ink-900 rounded-md p-0.5">
        <button
          type="button"
          onClick={() => setOnDemandMode(false)}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
            !onDemandMode ? 'bg-calm-600 text-white' : 'text-ink-400'
          }`}
        >
          Recurring
        </button>
        <button
          type="button"
          onClick={() => setOnDemandMode(true)}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
            onDemandMode ? 'bg-calm-600 text-white' : 'text-ink-400'
          }`}
        >
          On-demand
        </button>
      </div>

      <div className="flex gap-2">
        <label className="flex-1 flex flex-col text-[11px] text-ink-500 whitespace-nowrap">
          Energy points
          <select
            value={energyPoints}
            onChange={(e) => setEnergyPoints(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full h-8 mt-0.5 rounded-md bg-ink-900 border border-ink-700 px-2 text-sm text-ink-100 appearance-none"
          >
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 flex flex-col text-[11px] text-ink-500 whitespace-nowrap">
          Minutes
          <input
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full h-8 mt-0.5 rounded-md bg-ink-900 border border-ink-700 px-2 text-sm text-ink-100"
          />
        </label>
      </div>
      {!onDemandMode && (
        <div className="flex gap-2">
          <label className="flex-1 flex flex-col text-[11px] text-ink-500 whitespace-nowrap">
            Repeats every
            <input
              type="number"
              min={1}
              value={recurrenceValue}
              onChange={(e) => setRecurrenceValue(Number(e.target.value))}
              className="w-full h-8 mt-0.5 rounded-md bg-ink-900 border border-ink-700 px-2 text-sm text-ink-100"
            />
          </label>
          <label className="flex-1 flex flex-col text-[11px] text-ink-500 whitespace-nowrap">
            &nbsp;
            <select
              value={recurrenceUnit}
              onChange={(e) => setRecurrenceUnit(e.target.value as RecurrenceUnit)}
              className="w-full h-8 mt-0.5 rounded-md bg-ink-900 border border-ink-700 px-2 text-sm text-ink-100 appearance-none"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </label>
        </div>
      )}
      {!onDemandMode && (
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] text-ink-300">
            <input
              type="checkbox"
              checked={seasonal}
              onChange={(e) => setSeasonal(e.target.checked)}
            />
            Seasonal — only active certain months
          </label>
          {seasonal && (
            <div className="flex gap-2">
              <label className="flex-1 flex flex-col text-[11px] text-ink-500 whitespace-nowrap">
                From
                <select
                  value={seasonalStartMonth}
                  onChange={(e) => setSeasonalStartMonth(Number(e.target.value))}
                  className="w-full h-8 mt-0.5 rounded-md bg-ink-900 border border-ink-700 px-2 text-sm text-ink-100 appearance-none"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 flex flex-col text-[11px] text-ink-500 whitespace-nowrap">
                Through
                <select
                  value={seasonalEndMonth}
                  onChange={(e) => setSeasonalEndMonth(Number(e.target.value))}
                  className="w-full h-8 mt-0.5 rounded-md bg-ink-900 border border-ink-700 px-2 text-sm text-ink-100 appearance-none"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-calm-600 hover:bg-calm-700 text-white text-xs font-medium py-1.5 transition-colors"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-ink-700 text-ink-300 text-xs px-3 py-1.5 hover:bg-ink-900 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
