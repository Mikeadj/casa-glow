import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useSession } from '../state/useSession'
import { useProjects } from '../state/useProjects'
import { useTasks } from '../state/useTasks'
import { addProject, deleteProject, setProjectStatus, updateProject } from '../firebase/projects'
import { addProjectTask, markTaskDone, deleteTask, reopenTask } from '../firebase/tasks'
import type { Project, ProjectPriority, Task } from '../types'
import {
  DEFAULT_PROJECT_ICON,
  PROJECT_ICON_PRESETS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_PRIORITY_ORDER,
  PROJECT_PRIORITY_WEIGHT,
  projectMinutesLeft,
  projectProgress,
  projectStepsFor,
  sortByPriority,
  willCompleteProject,
} from '../lib/projects'
import { roomFillColor } from '../lib/roomColor'
import { formatMinutes } from '../lib/date'
import { playCoinSound, playFanfareSound } from '../lib/sound'
import EnergyBolts from '../components/EnergyBolts'
import PixelEmoji from '../components/PixelEmoji'
import ProgressBar from '../components/ProgressBar'

type PriorityFilter = 'all' | ProjectPriority

export default function ProjectsPage() {
  const householdId = useSession((s) => s.householdId)
  const uid = useSession((s) => s.user?.uid)
  const projects = useProjects(householdId)
  const tasks = useTasks(householdId)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [showDone, setShowDone] = useState(false)

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null

  const visibleProjects = sortByPriority(
    projects
      .filter((p) => showDone || p.status === 'active')
      .filter((p) => priorityFilter === 'all' || p.priority === priorityFilter),
  )

  async function handleAddProject(fields: {
    name: string
    description: string
    icon: string
    priority: ProjectPriority
    targetDate: number | null
  }) {
    if (!householdId) return
    const id = await addProject(householdId, fields)
    setSelectedProjectId(id)
    setShowAddForm(false)
  }

  async function handleDeleteProject(project: Project) {
    if (!householdId) return
    const steps = projectStepsFor(tasks, project.id)
    await Promise.all(steps.map((t) => deleteTask(householdId, t.id)))
    await deleteProject(householdId, project.id)
    setSelectedProjectId(null)
  }

  if (!householdId || !uid) return null

  const sidebarOpen = showAddForm || Boolean(selectedProject)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-100 flex items-center gap-2">
            <PixelEmoji emoji="⭐" size={24} resolution={7} /> Special Projects
          </h1>
          <p className="text-ink-300 text-sm mt-1">
            One-off builds — a home gym, a garden enclosure — tracked as their own thing, not
            another chore.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedProjectId(null)
            setShowAddForm(true)
          }}
          className="rounded-lg bg-brass-600 hover:bg-brass-700 text-white text-sm font-medium px-4 py-2 transition-colors shrink-0"
        >
          + New project
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <PriorityPill
          active={priorityFilter === 'all'}
          onClick={() => setPriorityFilter('all')}
          label="All"
        />
        {PROJECT_PRIORITY_ORDER.map((p) => (
          <PriorityPill
            key={p}
            active={priorityFilter === p}
            onClick={() => setPriorityFilter(p)}
            label={PROJECT_PRIORITY_LABELS[p]}
            color={roomFillColor(PROJECT_PRIORITY_WEIGHT[p])}
          />
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-500">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          Show completed
        </label>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {visibleProjects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-ink-500">
              {projects.length === 0
                ? "No special projects yet — start one for that home gym or garden enclosure you've been meaning to build."
                : 'Nothing matches this filter.'}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={tasks}
                selected={project.id === selectedProjectId}
                onClick={() => {
                  setShowAddForm(false)
                  setSelectedProjectId(project.id)
                }}
              />
            ))}
          </div>
        </div>

        {sidebarOpen && (
          <div className="w-80 shrink-0">
            {showAddForm && (
              <ProjectForm
                submitLabel="Create project"
                onSubmit={handleAddProject}
                onCancel={() => setShowAddForm(false)}
              />
            )}
            {!showAddForm && selectedProject && (
              <ProjectDetailPanel
                project={selectedProject}
                tasks={projectStepsFor(tasks, selectedProject.id)}
                householdId={householdId}
                uid={uid}
                onClose={() => setSelectedProjectId(null)}
                onDelete={() => handleDeleteProject(selectedProject)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PriorityPill({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-ink-800 text-ink-100 ring-1 ring-brass-600/60' : 'text-ink-500 hover:text-ink-300'
      }`}
    >
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {label}
    </button>
  )
}

function ProjectCard({
  project,
  tasks,
  selected,
  onClick,
}: {
  project: Project
  tasks: Task[]
  selected: boolean
  onClick: () => void
}) {
  const { done, total } = projectProgress(tasks, project.id)
  const minutesLeft = projectMinutesLeft(tasks, project.id)
  const urgencyColor = roomFillColor(PROJECT_PRIORITY_WEIGHT[project.priority])
  const fraction = total > 0 ? done / total : project.status === 'done' ? 1 : 0

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border bg-ink-900 p-4 space-y-3 transition-colors ${
        selected ? 'border-brass-500' : 'border-ink-700 hover:border-ink-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-lg shrink-0">{project.icon ?? DEFAULT_PROJECT_ICON}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-100 truncate">{project.name}</p>
            {project.description && (
              <p className="text-xs text-ink-500 truncate mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full mt-1"
          style={{ backgroundColor: urgencyColor }}
          title={`${PROJECT_PRIORITY_LABELS[project.priority]} priority`}
        />
      </div>

      <ProgressBar
        fraction={fraction}
        color={project.status === 'done' ? 'var(--color-calm-500)' : urgencyColor}
      />

      <div className="flex items-center justify-between text-[11px] text-ink-500">
        <span>
          {project.status === 'done'
            ? 'Complete'
            : total > 0
              ? `${done}/${total} steps`
              : 'No steps yet'}
        </span>
        <span>
          {project.status === 'done' ? '🎉' : minutesLeft > 0 ? `${formatMinutes(minutesLeft)} left` : ''}
        </span>
      </div>
    </button>
  )
}

function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Project
  submitLabel: string
  onSubmit: (fields: {
    name: string
    description: string
    icon: string
    priority: ProjectPriority
    targetDate: number | null
  }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? DEFAULT_PROJECT_ICON)
  const [priority, setPriority] = useState<ProjectPriority>(initial?.priority ?? 'medium')
  const [hasTargetDate, setHasTargetDate] = useState(initial?.targetDate != null)
  const [targetDate, setTargetDate] = useState(
    initial?.targetDate ? new Date(initial.targetDate).toISOString().slice(0, 10) : '',
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim() || DEFAULT_PROJECT_ICON,
      priority,
      targetDate: hasTargetDate && targetDate ? new Date(targetDate).getTime() : null,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ink-900 border border-brass-600/40 rounded-2xl p-4 space-y-3"
    >
      <h2 className="text-sm font-medium text-ink-100">New special project</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={4}
          className="w-14 shrink-0 rounded-lg bg-ink-800 border border-ink-700 px-2 py-2 text-lg text-center text-ink-100 focus:outline-none focus:border-brass-500"
          title="Icon"
        />
        <input
          autoFocus
          type="text"
          required
          placeholder="Project name — e.g. Build garden enclosure"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-500"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PROJECT_ICON_PRESETS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setIcon(emoji)}
            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${
              icon === emoji ? 'bg-brass-600/30 ring-1 ring-brass-500' : 'bg-ink-800 hover:bg-ink-700'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <textarea
        placeholder="What's this about? (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-500 resize-none"
      />
      <label className="flex flex-col gap-1 text-xs text-ink-500">
        Priority
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as ProjectPriority)}
          className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brass-500"
        >
          {PROJECT_PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PROJECT_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-300">
        <input
          type="checkbox"
          checked={hasTargetDate}
          onChange={(e) => setHasTargetDate(e.target.checked)}
        />
        Target date
      </label>
      {hasTargetDate && (
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brass-500"
        />
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-brass-600 hover:bg-brass-700 text-white text-sm font-medium py-2 transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink-700 text-ink-300 text-sm px-3 py-2 hover:bg-ink-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function ProjectDetailPanel({
  project,
  tasks,
  householdId,
  uid,
  onClose,
  onDelete,
}: {
  project: Project
  tasks: Task[]
  householdId: string
  uid: string
  onClose: () => void
  onDelete: () => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [icon, setIcon] = useState(project.icon ?? DEFAULT_PROJECT_ICON)
  const [showAddStep, setShowAddStep] = useState(false)

  useEffect(() => {
    setName(project.name)
    setDescription(project.description)
    setIcon(project.icon ?? DEFAULT_PROJECT_ICON)
  }, [project.id, project.name, project.description, project.icon])

  const { done, total } = projectProgress(tasks, project.id)
  const minutesLeft = projectMinutesLeft(tasks, project.id)
  const urgencyColor = roomFillColor(PROJECT_PRIORITY_WEIGHT[project.priority])

  async function saveName() {
    const trimmed = name.trim()
    if (!trimmed) return
    await updateProject(householdId, project.id, { name: trimmed })
  }

  async function completeStep(task: Task) {
    playCoinSound()
    const finishesProject = willCompleteProject(tasks, project.id, task.id)
    await markTaskDone(householdId, task, uid)
    if (finishesProject) {
      await setProjectStatus(householdId, project.id, 'done')
      playFanfareSound()
    }
  }

  return (
    <div className="bg-ink-900 border border-brass-600/40 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-100 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: urgencyColor }} />
          Project details
        </h2>
        <button onClick={onClose} className="text-ink-500 hover:text-ink-100 text-sm">
          ✕
        </button>
      </div>

      {project.status === 'done' && (
        <div className="rounded-lg bg-calm-600/15 border border-calm-600/40 px-3 py-2 text-xs text-calm-300 flex items-center justify-between">
          <span>🎉 Complete</span>
          <button
            onClick={() => setProjectStatus(householdId, project.id, 'active')}
            className="text-ink-500 hover:text-ink-300"
          >
            Reopen
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          onBlur={() => updateProject(householdId, project.id, { icon: icon.trim() || DEFAULT_PROJECT_ICON })}
          maxLength={4}
          className="w-14 shrink-0 rounded-lg bg-ink-800 border border-ink-700 px-2 py-2 text-lg text-center text-ink-100 focus:outline-none focus:border-brass-500"
          title="Icon"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="flex-1 min-w-0 rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brass-500"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PROJECT_ICON_PRESETS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              setIcon(emoji)
              updateProject(householdId, project.id, { icon: emoji })
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${
              icon === emoji ? 'bg-brass-600/30 ring-1 ring-brass-500' : 'bg-ink-800 hover:bg-ink-700'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => updateProject(householdId, project.id, { description: description.trim() })}
        rows={2}
        placeholder="What's this about?"
        className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-500 resize-none"
      />
      <label className="flex flex-col gap-1 text-xs text-ink-500">
        Priority
        <select
          value={project.priority}
          onChange={(e) =>
            updateProject(householdId, project.id, { priority: e.target.value as ProjectPriority })
          }
          className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-brass-500"
        >
          {PROJECT_PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PROJECT_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
          <span>{total > 0 ? `${done}/${total} steps` : 'No steps yet'}</span>
          {minutesLeft > 0 && <span>{formatMinutes(minutesLeft)} left</span>}
        </div>
        <ProgressBar fraction={total > 0 ? done / total : 0} />
      </div>

      <hr className="border-ink-800" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-ink-300 uppercase tracking-wide">Steps</h3>
          <button
            onClick={() => setShowAddStep((v) => !v)}
            className="text-xs text-brass-400 hover:text-brass-300"
          >
            {showAddStep ? 'Cancel' : '+ Add step'}
          </button>
        </div>

        {showAddStep && (
          <StepForm
            onSubmit={async (fields) => {
              await addProjectTask(householdId, project.id, fields)
              setShowAddStep(false)
            }}
          />
        )}

        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 rounded-lg bg-ink-800 px-3 py-2">
              <input
                type="checkbox"
                checked={task.completedAt != null}
                onChange={(e) =>
                  e.target.checked ? completeStep(task) : reopenTask(householdId, task.id)
                }
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm truncate ${
                    task.completedAt != null ? 'text-ink-500 line-through' : 'text-ink-100'
                  }`}
                >
                  {task.name}
                </p>
                <p className="text-[11px] text-ink-500 flex items-center gap-1">
                  <EnergyBolts count={task.energyPoints} /> · {task.estimatedMinutes}m
                </p>
              </div>
              <button
                onClick={() => deleteTask(householdId, task.id)}
                className="shrink-0 text-ink-500 hover:text-dirty-500 text-xs"
              >
                Delete
              </button>
            </li>
          ))}
          {tasks.length === 0 && !showAddStep && (
            <p className="text-xs text-ink-500">No steps yet — break the build down into pieces.</p>
          )}
        </ul>
      </div>

      <hr className="border-ink-800" />

      {project.status !== 'done' && (
        <button
          onClick={() => {
            setProjectStatus(householdId, project.id, 'done')
            playFanfareSound()
          }}
          className="w-full rounded-lg border border-calm-600 text-calm-300 text-sm py-2 hover:bg-calm-600/10 transition-colors"
        >
          Mark project complete
        </button>
      )}
      <button
        onClick={onDelete}
        className="w-full rounded-lg border border-dirty-700 text-dirty-500 text-sm py-2 hover:bg-dirty-700/10 transition-colors"
      >
        Delete project
      </button>
    </div>
  )
}

function StepForm({
  onSubmit,
}: {
  onSubmit: (fields: { name: string; energyPoints: 1 | 2 | 3 | 4 | 5; estimatedMinutes: number }) => void
}) {
  const [name, setName] = useState('')
  const [energyPoints, setEnergyPoints] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [estimatedMinutes, setEstimatedMinutes] = useState(20)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), energyPoints, estimatedMinutes })
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-ink-800 p-3 space-y-2">
      <input
        autoFocus
        type="text"
        required
        placeholder="Step name — e.g. Buy lumber"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md bg-ink-900 border border-ink-700 px-2.5 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-brass-500"
      />
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
      <button
        type="submit"
        className="w-full rounded-md bg-brass-600 hover:bg-brass-700 text-white text-xs font-medium py-1.5 transition-colors"
      >
        Add step
      </button>
    </form>
  )
}
