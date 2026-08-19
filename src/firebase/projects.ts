import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from './config'
import type { Project, ProjectPriority } from '../types'

export function subscribeProjects(householdId: string, callback: (projects: Project[]) => void) {
  return onSnapshot(collection(db, 'households', householdId, 'projects'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project))
  })
}

export async function addProject(
  householdId: string,
  fields: {
    name: string
    description: string
    icon: string
    priority: ProjectPriority
    targetDate: number | null
  },
): Promise<string> {
  const ref = await addDoc(collection(db, 'households', householdId, 'projects'), {
    ...fields,
    status: 'active',
    createdAt: Date.now(),
    completedAt: null,
  })
  return ref.id
}

export async function updateProject(
  householdId: string,
  projectId: string,
  fields: Partial<Pick<Project, 'name' | 'description' | 'icon' | 'priority' | 'targetDate'>>,
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'projects', projectId), fields)
}

export async function setProjectStatus(
  householdId: string,
  projectId: string,
  status: 'active' | 'done',
): Promise<void> {
  await updateDoc(doc(db, 'households', householdId, 'projects', projectId), {
    status,
    completedAt: status === 'done' ? Date.now() : null,
  })
}

export async function deleteProject(householdId: string, projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'projects', projectId))
}
