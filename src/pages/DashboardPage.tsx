import { useSession } from '../state/useSession'
import { useHouseholdStore } from '../state/useHouseholdStore'
import { useTasks } from '../state/useTasks'
import { useRooms } from '../state/useRooms'
import { useProjects } from '../state/useProjects'
import { useAllTodayCheckIns, useTodayCheckIns } from '../state/useCheckIns'
import { useWeeklyActivity } from '../state/useActivity'
import { minutesByRoom, totalMinutes } from '../lib/activity'
import CheckInPanel from '../components/CheckInPanel'
import CleanEstimateBanner from '../components/CleanEstimateBanner'
import ProjectsTimeBanner from '../components/ProjectsTimeBanner'
import AssignmentBoard from '../components/AssignmentBoard'
import HouseholdPulse from '../components/HouseholdPulse'
import WeeklyPieChart from '../components/WeeklyPieChart'
import ActivityFeed from '../components/ActivityFeed'

export default function DashboardPage() {
  const householdId = useSession((s) => s.householdId)
  const uid = useSession((s) => s.user?.uid)
  const members = useHouseholdStore((s) => s.members)
  const household = useHouseholdStore((s) => s.household)
  const tasks = useTasks(householdId)
  const rooms = useRooms(householdId)
  const projects = useProjects(householdId)
  const checkIns = useTodayCheckIns(householdId)
  const allCheckIns = useAllTodayCheckIns(householdId)
  const weeklyActivity = useWeeklyActivity(householdId, household?.weekStartDay ?? 'sunday')

  if (!householdId || !uid) return null

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-100">Dashboard</h1>
        <p className="text-ink-300 text-sm mt-1">Your daily check-in and house-wide status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <CleanEstimateBanner tasks={tasks} household={household} />
          <ProjectsTimeBanner tasks={tasks} projects={projects} />

          <CheckInPanel householdId={householdId} uid={uid} existing={checkIns[uid] ?? null} />

          {members.length > 1 && (
            <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
              <p className="text-xs text-ink-500 uppercase tracking-wide mb-3">
                Household check-ins
              </p>
              <ul className="space-y-2">
                {members.map((m) => {
                  const checkIn = checkIns[m.uid]
                  return (
                    <li key={m.uid} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-100">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                        {m.displayName}
                      </span>
                      <span className="text-ink-500">
                        {checkIn
                          ? `Energy ${checkIn.energyLevel}/5 · ${checkIn.availableMinutes}m`
                          : 'Not checked in yet'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <AssignmentBoard
            householdId={householdId}
            uid={uid}
            tasks={tasks}
            members={members}
            rooms={rooms}
            projects={projects}
            activity={weeklyActivity}
            checkIns={checkIns}
          />
        </div>

        <div className="space-y-6 min-w-0">
          <HouseholdPulse checkIns={allCheckIns} totalMembers={members.length} />
          <WeeklyPieChart
            slices={minutesByRoom(weeklyActivity, rooms)}
            totalMinutes={totalMinutes(weeklyActivity)}
            rooms={rooms}
          />
          <ActivityFeed entries={weeklyActivity} members={members} rooms={rooms} projects={projects} />
        </div>
      </div>
    </div>
  )
}
