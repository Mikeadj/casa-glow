import { useEffect, useState } from 'react'
import type { Project } from '../types'
import { subscribeProjects } from '../firebase/projects'

export function useProjects(householdId: string | null): Project[] {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!householdId) {
      setProjects([])
      return
    }
    return subscribeProjects(householdId, setProjects)
  }, [householdId])

  return projects
}
