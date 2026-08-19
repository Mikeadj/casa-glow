import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useSession } from '../state/useSession'
import { useTasks } from '../state/useTasks'
import { useRooms } from '../state/useRooms'
import { useHouseholdStore } from '../state/useHouseholdStore'
import {
  addRoom,
  deleteRoom,
  renameRoom,
  setRoomAssignedMember,
  updateRoomLayout,
} from '../firebase/rooms'
import { deleteTask } from '../firebase/tasks'
import type { Member, Room, RoomType, Task } from '../types'
import { ROOM_TYPE_LABELS } from '../types'
import { roomDirtiness } from '../lib/dirty'
import { flavorText } from '../lib/flavorText'
import FloorPlanCanvas from '../components/FloorPlanCanvas'
import RoomTaskPanel from '../components/RoomTaskPanel'
import ProgressBar from '../components/ProgressBar'

const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS) as RoomType[]
const DEFAULT_SIZE = { width: 4, height: 3 }

export default function FloorPlanPage() {
  const householdId = useSession((s) => s.householdId)
  const uid = useSession((s) => s.user?.uid)
  const rooms = useRooms(householdId)
  const tasks = useTasks(householdId)
  const members = useHouseholdStore((s) => s.members)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null

  const dirtinessByRoom = rooms.reduce<Record<string, number>>((acc, room) => {
    acc[room.id] = roomDirtiness(tasks.filter((t) => t.roomId === room.id))
    return acc
  }, {})

  function nextFreeSpot(): { x: number; y: number } {
    if (rooms.length === 0) return { x: 0, y: 0 }
    const rightmost = rooms.reduce((max, r) => Math.max(max, r.x + r.width), 0)
    return { x: rightmost + 1, y: 0 }
  }

  async function handleAddRoom(name: string, type: RoomType) {
    if (!householdId) return
    const spot = nextFreeSpot()
    const id = await addRoom(householdId, {
      name,
      type,
      x: spot.x,
      y: spot.y,
      ...DEFAULT_SIZE,
      assignedMemberUid: null,
    })
    setSelectedRoomId(id)
    setShowAddForm(false)
  }

  async function handleUpdateLayout(
    roomId: string,
    layout: Partial<Pick<Room, 'x' | 'y' | 'width' | 'height'>>,
  ) {
    if (!householdId) return
    await updateRoomLayout(householdId, roomId, layout)
  }

  async function handleDeleteRoom(room: Room) {
    if (!householdId) return
    const roomTasks = tasks.filter((t) => t.roomId === room.id)
    await Promise.all(roomTasks.map((t) => deleteTask(householdId, t.id)))
    await deleteRoom(householdId, room.id)
    setSelectedRoomId(null)
  }

  const sidebarOpen = showAddForm || Boolean(selectedRoom)

  return (
    <div className="h-full flex flex-col px-8 py-6">
      <div className="flex items-start justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-ink-100">Floor Plan</h1>
          <p className="text-ink-300 text-sm mt-1">
            {rooms.length === 0
              ? 'Add your rooms and drag them into place to build your house, top-down.'
              : 'Drag to move, use the corner handle to resize, click a room for its details.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-lg bg-calm-600 hover:bg-calm-700 text-white text-sm font-medium px-4 py-2 transition-colors shrink-0"
        >
          + Add room
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        <div className="flex-1 min-w-0">
          <FloorPlanCanvas
            rooms={rooms}
            dirtiness={dirtinessByRoom}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            onUpdateLayout={handleUpdateLayout}
          />
        </div>

        {sidebarOpen && (
          <div className="w-80 shrink-0 overflow-y-auto">
            {showAddForm && (
              <AddRoomForm onSubmit={handleAddRoom} onCancel={() => setShowAddForm(false)} />
            )}

            {!showAddForm && selectedRoom && householdId && uid && (
              <RoomDetailPanel
                room={selectedRoom}
                tasks={tasks.filter((t) => t.roomId === selectedRoom.id)}
                householdId={householdId}
                uid={uid}
                members={members}
                onClose={() => setSelectedRoomId(null)}
                onDelete={() => handleDeleteRoom(selectedRoom)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddRoomForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, type: RoomType) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<RoomType>('bedroom')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), type)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ink-900 border border-ink-700 rounded-2xl p-4 space-y-3"
    >
      <h2 className="text-sm font-medium text-ink-100">New room</h2>
      <input
        autoFocus
        type="text"
        required
        placeholder="Room name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-calm-500"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as RoomType)}
        className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-calm-500"
      >
        {ROOM_TYPES.map((t) => (
          <option key={t} value={t}>
            {ROOM_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-calm-600 hover:bg-calm-700 text-white text-sm font-medium py-2 transition-colors"
        >
          Add
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

function RoomDetailPanel({
  room,
  tasks,
  householdId,
  uid,
  members,
  onClose,
  onDelete,
}: {
  room: Room
  tasks: Task[]
  householdId: string
  uid: string
  members: Member[]
  onClose: () => void
  onDelete: () => void
}) {
  const [name, setName] = useState(room.name)
  const [type, setType] = useState<RoomType>(room.type)

  useEffect(() => {
    setName(room.name)
    setType(room.type)
  }, [room.id, room.name, room.type])

  async function handleSave(overrides?: { name?: string; type?: RoomType }) {
    const nextName = (overrides?.name ?? name).trim()
    const nextType = overrides?.type ?? type
    if (!nextName) return
    await renameRoom(householdId, room.id, nextName, nextType)
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-100">Room details</h2>
        <button onClick={onClose} className="text-ink-500 hover:text-ink-100 text-sm">
          ✕
        </button>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleSave()}
          className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-calm-500"
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-ink-500">
            <span>Clean</span>
            <span>{Math.round((1 - roomDirtiness(tasks)) * 100)}%</span>
          </div>
          <ProgressBar fraction={1 - roomDirtiness(tasks)} />
        </div>
        <select
          value={type}
          onChange={(e) => {
            const nextType = e.target.value as RoomType
            setType(nextType)
            handleSave({ type: nextType })
          }}
          className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-calm-500"
        >
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>
              {ROOM_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-400 italic">
          {flavorText(roomDirtiness(tasks), room.id)}
        </p>
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Assigned to
          <select
            value={room.assignedMemberUid ?? ''}
            onChange={(e) => setRoomAssignedMember(householdId, room.id, e.target.value || null)}
            className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-calm-500"
          >
            <option value="">Anyone checked in</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName} only
              </option>
            ))}
          </select>
          {room.assignedMemberUid && (
            <span className="text-[11px] text-ink-500">
              Only{' '}
              {members.find((m) => m.uid === room.assignedMemberUid)?.displayName ??
                'that member'}{' '}
              gets this room's tasks auto-assigned.
            </span>
          )}
        </label>
      </div>

      <hr className="border-ink-800" />

      <RoomTaskPanel room={room} tasks={tasks} householdId={householdId} uid={uid} />

      <button
        onClick={onDelete}
        className="w-full rounded-lg border border-dirty-700 text-dirty-500 text-sm py-2 hover:bg-dirty-700/10 transition-colors"
      >
        Delete room
      </button>
    </div>
  )
}
