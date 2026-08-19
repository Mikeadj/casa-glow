import { useEffect, useState } from 'react'
import type { Task } from '../types'
import { subscribeTasks } from '../firebase/tasks'

export function useTasks(householdId: string | null): Task[] {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!householdId) {
      setTasks([])
      return
    }
    return subscribeTasks(householdId, setTasks)
  }, [householdId])

  return tasks
}
