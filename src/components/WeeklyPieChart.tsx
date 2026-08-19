import type { Room } from '../types'
import type { RoomTimeSlice } from '../lib/activity'
import { formatMinutes } from '../lib/date'

interface Props {
  slices: RoomTimeSlice[]
  totalMinutes: number
  rooms: Room[]
}

// Hue spaced by the golden angle so any number of rooms stays maximally
// distinct from its neighbors, instead of a small hand-picked palette that
// collides into "everything's orange" once a couple of rooms repeat a hue.
// Keyed to each room's position in the full household room list (not just
// the rooms with activity this week) so a room keeps the same color over
// time rather than reshuffling as the weekly ranking changes.
const GOLDEN_ANGLE = 137.508

function colorForRoomIndex(index: number): string {
  const hue = Math.round((index * GOLDEN_ANGLE) % 360)
  return `hsl(${hue}, 58%, 58%)`
}

const SIZE = 140
const STROKE = 22
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function WeeklyPieChart({ slices, totalMinutes, rooms }: Props) {
  const colorForRoom = (roomId: string) => {
    const index = rooms.findIndex((r) => r.id === roomId)
    return colorForRoomIndex(index === -1 ? 0 : index)
  }

  if (slices.length === 0 || totalMinutes === 0) {
    return (
      <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
        <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">This week, together</p>
        <p className="text-sm text-ink-500 mt-2">
          No completed tasks logged yet this week — the household's time-together chart shows up
          here once someone marks something clean.
        </p>
      </div>
    )
  }

  let cumulative = 0

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
      <p className="text-xs text-ink-500 uppercase tracking-wide mb-3">This week, together</p>
      <div className="flex items-center gap-5">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-ink-800)"
              strokeWidth={STROKE}
            />
            {slices.map((slice) => {
              const fraction = slice.minutes / totalMinutes
              const dash = fraction * CIRCUMFERENCE
              const offset = -cumulative * CIRCUMFERENCE
              cumulative += fraction
              return (
                <circle
                  key={slice.roomId}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={colorForRoom(slice.roomId)}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={offset}
                >
                  <title>
                    {slice.roomName} · {formatMinutes(slice.minutes)}
                  </title>
                </circle>
              )
            })}
          </g>
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 4}
            textAnchor="middle"
            className="fill-ink-100 text-sm font-semibold"
          >
            {formatMinutes(totalMinutes)}
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 14}
            textAnchor="middle"
            className="fill-ink-500 text-[10px] uppercase tracking-wide"
          >
            combined
          </text>
        </svg>

        <ul className="min-w-0 space-y-1.5 flex-1">
          {slices.map((slice) => (
            <li key={slice.roomId} className="flex items-center gap-2 text-xs min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: colorForRoom(slice.roomId) }}
              />
              <span className="text-ink-100 truncate">{slice.roomName}</span>
              <span className="text-ink-500 ml-auto shrink-0">
                {formatMinutes(slice.minutes)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
