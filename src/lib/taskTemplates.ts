import type { RoomType } from '../types'

export interface TaskTemplate {
  name: string
  energyPoints: 1 | 2 | 3 | 4 | 5
  estimatedMinutes: number
  recurrenceDays: number
}

export const TASK_TEMPLATES: Record<RoomType, TaskTemplate[]> = {
  kitchen: [
    { name: 'Wipe counters', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 1 },
    { name: 'Wash dishes', energyPoints: 2, estimatedMinutes: 15, recurrenceDays: 1 },
    { name: 'Sweep floor', energyPoints: 2, estimatedMinutes: 10, recurrenceDays: 3 },
    { name: 'Clean stovetop', energyPoints: 3, estimatedMinutes: 15, recurrenceDays: 5 },
    { name: 'Clean out fridge', energyPoints: 4, estimatedMinutes: 25, recurrenceDays: 14 },
  ],
  bathroom: [
    { name: 'Wipe sink & counter', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 2 },
    { name: 'Clean toilet', energyPoints: 3, estimatedMinutes: 10, recurrenceDays: 4 },
    { name: 'Scrub shower/tub', energyPoints: 4, estimatedMinutes: 20, recurrenceDays: 7 },
    { name: 'Mop floor', energyPoints: 2, estimatedMinutes: 10, recurrenceDays: 5 },
  ],
  bedroom: [
    { name: 'Make bed', energyPoints: 1, estimatedMinutes: 3, recurrenceDays: 1 },
    { name: 'Tidy surfaces', energyPoints: 1, estimatedMinutes: 8, recurrenceDays: 3 },
    { name: 'Vacuum floor', energyPoints: 3, estimatedMinutes: 12, recurrenceDays: 7 },
    { name: 'Change sheets', energyPoints: 3, estimatedMinutes: 15, recurrenceDays: 14 },
  ],
  'living-room': [
    { name: 'Tidy surfaces', energyPoints: 1, estimatedMinutes: 8, recurrenceDays: 2 },
    { name: 'Vacuum floor', energyPoints: 3, estimatedMinutes: 15, recurrenceDays: 5 },
    { name: 'Dust shelves & furniture', energyPoints: 2, estimatedMinutes: 12, recurrenceDays: 7 },
    { name: 'Fluff & arrange cushions', energyPoints: 1, estimatedMinutes: 3, recurrenceDays: 3 },
  ],
  'dining-room': [
    { name: 'Wipe table', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 2 },
    { name: 'Sweep/vacuum floor', energyPoints: 2, estimatedMinutes: 10, recurrenceDays: 5 },
  ],
  office: [
    { name: 'Tidy desk', energyPoints: 1, estimatedMinutes: 8, recurrenceDays: 3 },
    { name: 'Vacuum floor', energyPoints: 3, estimatedMinutes: 10, recurrenceDays: 7 },
  ],
  laundry: [
    { name: 'Run a load', energyPoints: 2, estimatedMinutes: 10, recurrenceDays: 4 },
    { name: 'Wipe machines', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 7 },
  ],
  hallway: [
    { name: 'Sweep/vacuum floor', energyPoints: 1, estimatedMinutes: 8, recurrenceDays: 5 },
    { name: 'Tidy shoes/coats', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 3 },
  ],
  gym: [
    { name: 'Wipe down equipment', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 2 },
    { name: 'Sanitize mats', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 3 },
    { name: 'Sweep/vacuum floor', energyPoints: 2, estimatedMinutes: 10, recurrenceDays: 5 },
    { name: 'Wipe mirrors', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 7 },
    { name: 'Restock towels & supplies', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 7 },
  ],
  garage: [
    { name: 'Sweep floor', energyPoints: 2, estimatedMinutes: 15, recurrenceDays: 14 },
    { name: 'Tidy tools & shelves', energyPoints: 2, estimatedMinutes: 15, recurrenceDays: 30 },
    { name: 'Take out recycling/trash', energyPoints: 1, estimatedMinutes: 5, recurrenceDays: 7 },
  ],
  storage: [
    { name: 'Tidy shelves/boxes', energyPoints: 2, estimatedMinutes: 15, recurrenceDays: 30 },
    { name: 'Sweep/vacuum floor', energyPoints: 1, estimatedMinutes: 8, recurrenceDays: 30 },
  ],
  yard: [
    { name: 'Mow lawn', energyPoints: 3, estimatedMinutes: 30, recurrenceDays: 7 },
    { name: 'Rake leaves', energyPoints: 2, estimatedMinutes: 20, recurrenceDays: 14 },
    { name: 'Sweep walkway/porch', energyPoints: 1, estimatedMinutes: 10, recurrenceDays: 7 },
    { name: 'Water lawn', energyPoints: 1, estimatedMinutes: 10, recurrenceDays: 3 },
  ],
  garden: [
    { name: 'Water plants', energyPoints: 1, estimatedMinutes: 10, recurrenceDays: 2 },
    { name: 'Weed garden beds', energyPoints: 2, estimatedMinutes: 20, recurrenceDays: 7 },
    { name: 'Prune/trim plants', energyPoints: 2, estimatedMinutes: 15, recurrenceDays: 14 },
    { name: 'Deadhead flowers', energyPoints: 1, estimatedMinutes: 10, recurrenceDays: 7 },
  ],
  other: [{ name: 'Tidy up', energyPoints: 1, estimatedMinutes: 10, recurrenceDays: 5 }],
}
