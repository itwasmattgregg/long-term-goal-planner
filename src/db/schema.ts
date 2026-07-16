import Dexie, { type EntityTable } from 'dexie'

export type GoalStatus = 'active' | 'paused' | 'done'
export type EntryKind = 'update' | 'success' | 'failure' | 'decision' | 'checkin' | 'created'
export type MilestoneStatus = 'open' | 'done'

export interface Goal {
  id: string
  title: string
  status: GoalStatus
  pinned: boolean
  xp: number
  level: number
  lastTouchedAt: string
  createdAt: string
  /** ISO timestamp when soft-deleted; null while visible. */
  deletedAt: string | null
}

export interface Entry {
  id: string
  goalId: string
  rawText: string
  kind: EntryKind
  createdAt: string
}

export interface Milestone {
  id: string
  goalId: string
  title: string
  status: MilestoneStatus
  sortOrder: number
  createdAt: string
}

export interface DailyFocus {
  date: string
  primaryGoalId: string | null
  nudgeGoalId: string | null
}

export interface AppMeta {
  key: string
  value: string
}

class HorizonDB extends Dexie {
  goals!: EntityTable<Goal, 'id'>
  entries!: EntityTable<Entry, 'id'>
  milestones!: EntityTable<Milestone, 'id'>
  dailyFocus!: EntityTable<DailyFocus, 'date'>
  meta!: EntityTable<AppMeta, 'key'>

  constructor() {
    super('horizon')
    this.version(1).stores({
      goals: 'id, status, lastTouchedAt, createdAt',
      entries: 'id, goalId, createdAt, kind',
      milestones: 'id, goalId, status, sortOrder',
      dailyFocus: 'date',
      meta: 'key',
    })
    this.version(2)
      .stores({
        goals: 'id, status, lastTouchedAt, createdAt, deletedAt',
        entries: 'id, goalId, createdAt, kind',
        milestones: 'id, goalId, status, sortOrder',
        dailyFocus: 'date',
        meta: 'key',
      })
      .upgrade(async (tx) => {
        await tx
          .table('goals')
          .toCollection()
          .modify((goal: { deletedAt?: string | null }) => {
            if (goal.deletedAt === undefined) goal.deletedAt = null
          })
      })
  }
}

export const db = new HorizonDB()

export function uid(): string {
  return crypto.randomUUID()
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}
