import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Room } from '../types'
import { ROOM_TYPE_LABELS } from '../types'
import { roomFillColor } from '../lib/roomColor'
import PixelEmoji from './PixelEmoji'

const CELL = 48 // px per grid unit, in fixed "world" space — independent of zoom
const MIN_CELLS = 2
const PADDING_CELLS = 2

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.25

const ROOM_ICONS: Record<Room['type'], string> = {
  bedroom: '🛏️',
  bathroom: '🛁',
  kitchen: '🍳',
  'living-room': '🛋️',
  'dining-room': '🍽️',
  office: '💻',
  laundry: '🧺',
  hallway: '🚪',
  gym: '🏋️',
  garage: '🚗',
  storage: '📦',
  yard: '🌳',
  garden: '🌻',
  other: '🗂️',
}

interface DragState {
  roomId: string
  mode: 'move' | 'resize'
  pointerStartX: number
  pointerStartY: number
  orig: Pick<Room, 'x' | 'y' | 'width' | 'height'>
}

interface PanDrag {
  startClientX: number
  startClientY: number
  startPan: { x: number; y: number }
}

interface Props {
  rooms: Room[]
  dirtiness?: Record<string, number>
  selectedRoomId: string | null
  onSelectRoom: (roomId: string | null) => void
  onUpdateLayout: (
    roomId: string,
    layout: Partial<Pick<Room, 'x' | 'y' | 'width' | 'height'>>,
  ) => void
}

export default function FloorPlanCanvas({
  rooms,
  dirtiness = {},
  selectedRoomId,
  onSelectRoom,
  onUpdateLayout,
}: Props) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [panDrag, setPanDrag] = useState<PanDrag | null>(null)
  const [liveRooms, setLiveRooms] = useState<Record<string, Room>>({})
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<{ x: number; y: number } | null>(null)

  // The canvas box fills whatever space its parent gives it — zooming
  // changes how much of the world is visible inside that box, like a map,
  // not how big the box itself is. Measured live so the view redraws
  // in place whenever the surrounding layout (e.g. the sidebar) resizes it.
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 720, height: 540 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect && rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const VIEWPORT_W = viewport.width
  const VIEWPORT_H = viewport.height

  const displayRooms = rooms.map((r) => liveRooms[r.id] ?? r)

  // Content extent in fixed world-pixel space (never scaled by zoom).
  const contentBox = useMemo(() => {
    if (displayRooms.length === 0) {
      return { minX: 0, minY: 0, maxX: 12 * CELL, maxY: 8 * CELL }
    }
    const minXu = Math.min(0, ...displayRooms.map((r) => r.x)) - PADDING_CELLS
    const minYu = Math.min(0, ...displayRooms.map((r) => r.y)) - PADDING_CELLS
    const maxXu = Math.max(...displayRooms.map((r) => r.x + r.width)) + PADDING_CELLS
    const maxYu = Math.max(...displayRooms.map((r) => r.y + r.height)) + PADDING_CELLS
    return { minX: minXu * CELL, minY: minYu * CELL, maxX: maxXu * CELL, maxY: maxYu * CELL }
  }, [displayRooms])

  function centeredPan(z: number) {
    const viewW = VIEWPORT_W / z
    const viewH = VIEWPORT_H / z
    const boxW = contentBox.maxX - contentBox.minX
    const boxH = contentBox.maxY - contentBox.minY
    return {
      x: contentBox.minX + (boxW - viewW) / 2,
      y: contentBox.minY + (boxH - viewH) / 2,
    }
  }

  const effPan = pan ?? centeredPan(zoom)
  const viewW = VIEWPORT_W / zoom
  const viewH = VIEWPORT_H / zoom

  function applyZoom(nextZoom: number) {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(nextZoom * 100) / 100))
    // Zoom around the current view's center instead of its top-left corner.
    const centerX = effPan.x + viewW / 2
    const centerY = effPan.y + viewH / 2
    const nextViewW = VIEWPORT_W / clamped
    const nextViewH = VIEWPORT_H / clamped
    setPan({ x: centerX - nextViewW / 2, y: centerY - nextViewH / 2 })
    setZoom(clamped)
  }

  function resetView() {
    setZoom(1)
    setPan(null)
  }

  function toGridDelta(clientDx: number, clientDy: number) {
    return {
      dx: Math.round(clientDx / (CELL * zoom)),
      dy: Math.round(clientDy / (CELL * zoom)),
    }
  }

  function startDrag(e: ReactPointerEvent, room: Room, mode: DragState['mode']) {
    e.stopPropagation()
    onSelectRoom(room.id)
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // Ignore — pointer capture can fail for synthetic/edge-case pointer
      // sessions; dragging still works via the window-level move/up handlers.
    }
    setDrag({
      roomId: room.id,
      mode,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      orig: { x: room.x, y: room.y, width: room.width, height: room.height },
    })
  }

  function startPan(e: ReactPointerEvent) {
    onSelectRoom(null)
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // Ignore — see startDrag.
    }
    setPanDrag({ startClientX: e.clientX, startClientY: e.clientY, startPan: effPan })
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (drag) {
      const { dx, dy } = toGridDelta(e.clientX - drag.pointerStartX, e.clientY - drag.pointerStartY)
      const room = rooms.find((r) => r.id === drag.roomId)
      if (!room) return

      if (drag.mode === 'move') {
        setLiveRooms((prev) => ({
          ...prev,
          [room.id]: { ...room, x: drag.orig.x + dx, y: drag.orig.y + dy },
        }))
      } else {
        setLiveRooms((prev) => ({
          ...prev,
          [room.id]: {
            ...room,
            width: Math.max(MIN_CELLS, drag.orig.width + dx),
            height: Math.max(MIN_CELLS, drag.orig.height + dy),
          },
        }))
      }
    } else if (panDrag) {
      const worldDx = (e.clientX - panDrag.startClientX) / zoom
      const worldDy = (e.clientY - panDrag.startClientY) / zoom
      setPan({ x: panDrag.startPan.x - worldDx, y: panDrag.startPan.y - worldDy })
    }
  }

  function endDrag() {
    if (drag) {
      const roomId = drag.roomId
      const updated = liveRooms[roomId]
      if (updated) {
        onUpdateLayout(roomId, {
          x: updated.x,
          y: updated.y,
          width: updated.width,
          height: updated.height,
        })
        // Keep the optimistic position until Firestore's echo has had time to
        // arrive, then hand rendering back to the synced `rooms` prop so
        // updates from other members aren't permanently shadowed.
        setTimeout(() => {
          setLiveRooms((prev) => {
            const { [roomId]: _drop, ...rest } = prev
            return rest
          })
        }, 1500)
      }
      setDrag(null)
    }
    setPanDrag(null)
  }

  const gridId = 'floor-plan-grid'

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/40"
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-ink-900/90 border border-ink-700 rounded-lg px-1.5 py-1 shadow-lg">
        <button
          type="button"
          onClick={() => applyZoom(zoom - ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN}
          className="w-6 h-6 flex items-center justify-center rounded text-ink-300 hover:bg-ink-800 hover:text-ink-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          className="w-12 text-center text-[11px] text-ink-400 hover:text-ink-100 transition-colors"
          title="Reset view"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => applyZoom(zoom + ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX}
          className="w-6 h-6 flex items-center justify-center rounded text-ink-300 hover:bg-ink-800 hover:text-ink-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Zoom in"
        >
          +
        </button>
      </div>
      <svg
        width={VIEWPORT_W}
        height={VIEWPORT_H}
        viewBox={`${effPan.x} ${effPan.y} ${viewW} ${viewH}`}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerMove={onPointerMove}
        className="block"
      >
        <defs>
          <pattern id={gridId} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path
              d={`M ${CELL} 0 L 0 0 0 ${CELL}`}
              fill="none"
              stroke="var(--color-ink-800)"
              strokeWidth={1}
            />
          </pattern>
        </defs>
        <rect
          x={effPan.x}
          y={effPan.y}
          width={viewW}
          height={viewH}
          fill={`url(#${gridId})`}
          onPointerDown={startPan}
          className={panDrag ? 'cursor-grabbing' : 'cursor-grab'}
        />

        {displayRooms.map((room) => {
          const px = room.x * CELL
          const py = room.y * CELL
          const w = room.width * CELL
          const h = room.height * CELL
          const selected = room.id === selectedRoomId
          const fill = roomFillColor(dirtiness[room.id] ?? 0)

          return (
            <g key={room.id}>
              <rect
                x={px}
                y={py}
                width={w}
                height={h}
                rx={10}
                fill={fill}
                fillOpacity={0.28}
                stroke={fill}
                strokeWidth={selected ? 3 : 1.5}
                onPointerDown={(e) => startDrag(e, room, 'move')}
                className="cursor-move transition-[stroke-width]"
              />
              <foreignObject x={px} y={py} width={w} height={h} className="pointer-events-none">
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-1 select-none">
                  <PixelEmoji emoji={ROOM_ICONS[room.type]} size={20} resolution={6} />
                  <span className="text-xs font-medium text-ink-100 mt-1 truncate max-w-full">
                    {room.name}
                  </span>
                  <span className="text-[10px] text-ink-300">{ROOM_TYPE_LABELS[room.type]}</span>
                </div>
              </foreignObject>
              <rect
                x={px + w - 14}
                y={py + h - 14}
                width={14}
                height={14}
                fill="transparent"
                onPointerDown={(e) => startDrag(e, room, 'resize')}
                className="cursor-nwse-resize"
              />
              <path
                d={`M ${px + w - 10} ${py + h - 2} L ${px + w - 2} ${py + h - 10}`}
                stroke="var(--color-ink-300)"
                strokeWidth={2}
                strokeLinecap="round"
                className="pointer-events-none"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
