import { db, uid, type Entry, type EntryKind, type Goal, type Milestone } from './schema'
import {
  DEFAULT_LEVEL_SYSTEM_ID,
  type LevelSystemId,
} from '../lib/levelSystems'
import { levelFromXp, xpForKind, xpForMilestone, xpProgress } from '../lib/xp'

export const PROFILE_CHANGED_EVENT = 'horizon:profile'
export const LEVEL_SYSTEM_CHANGED_EVENT = 'horizon:level-system'

const META_LEVEL_SYSTEM = 'levelSystem'

function notifyProfileChanged() {
  window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT))
}

function notifyLevelSystemChanged() {
  window.dispatchEvent(new CustomEvent(LEVEL_SYSTEM_CHANGED_EVENT))
}

function isVisible(goal: Goal): boolean {
  return !goal.deletedAt
}

export async function getLevelSystemPreference(): Promise<LevelSystemId> {
  const row = await db.meta.get(META_LEVEL_SYSTEM)
  const value = row?.value
  if (
    value === 'classic' ||
    value === 'arcane' ||
    value === 'might' ||
    value === 'dawn' ||
    value === 'trail'
  ) {
    return value
  }
  return DEFAULT_LEVEL_SYSTEM_ID
}

export async function setLevelSystemPreference(id: LevelSystemId): Promise<void> {
  await db.meta.put({ key: META_LEVEL_SYSTEM, value: id })
  notifyLevelSystemChanged()
}

export async function getAllGoals(): Promise<Goal[]> {
  const goals = await db.goals.orderBy('lastTouchedAt').reverse().toArray()
  return goals.filter(isVisible)
}

export async function getActiveGoals(): Promise<Goal[]> {
  const goals = await db.goals.where('status').equals('active').toArray()
  return goals.filter(isVisible)
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  const goal = await db.goals.get(id)
  if (!goal || goal.deletedAt) return undefined
  return goal
}

/** Total XP across every goal, including soft-deleted ones. */
export async function getProfileProgress(): Promise<ReturnType<typeof xpProgress> & { xp: number }> {
  const goals = await db.goals.toArray()
  const xp = goals.reduce((sum, g) => sum + g.xp, 0)
  return { xp, ...xpProgress(xp) }
}

export async function getEntriesForGoal(goalId: string): Promise<Entry[]> {
  return db.entries.where('goalId').equals(goalId).reverse().sortBy('createdAt')
}

export async function getRecentEntries(limit = 5): Promise<Entry[]> {
  return db.entries.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function getMilestonesForGoal(goalId: string): Promise<Milestone[]> {
  return db.milestones.where('goalId').equals(goalId).sortBy('sortOrder')
}

export async function createGoal(title: string): Promise<Goal> {
  const now = new Date().toISOString()
  const goal: Goal = {
    id: uid(),
    title: title.trim(),
    status: 'active',
    pinned: false,
    xp: 0,
    level: 1,
    lastTouchedAt: now,
    createdAt: now,
    deletedAt: null,
  }
  await db.goals.add(goal)
  notifyProfileChanged()
  return goal
}

export interface SaveEntryResult {
  entry: Entry
  goal: Goal
  leveledUp: boolean
  previousLevel: number
}

export async function saveEntry(
  goalId: string,
  rawText: string,
  kind: EntryKind,
): Promise<SaveEntryResult> {
  const goal = await getGoal(goalId)
  if (!goal) throw new Error('Goal not found')

  const now = new Date().toISOString()
  const entry: Entry = {
    id: uid(),
    goalId,
    rawText: rawText.trim(),
    kind,
    createdAt: now,
  }

  const xpGain = xpForKind(kind)
  const newXp = goal.xp + xpGain
  const previousLevel = goal.level
  const newLevel = levelFromXp(newXp)
  const leveledUp = newLevel > previousLevel

  const updated: Goal = {
    ...goal,
    xp: newXp,
    level: newLevel,
    lastTouchedAt: now,
  }

  await db.transaction('rw', db.entries, db.goals, async () => {
    await db.entries.add(entry)
    await db.goals.put(updated)
  })

  notifyProfileChanged()
  return { entry, goal: updated, leveledUp, previousLevel }
}

export async function addMilestone(goalId: string, title: string): Promise<Milestone> {
  const existing = await db.milestones.where('goalId').equals(goalId).count()
  const milestone: Milestone = {
    id: uid(),
    goalId,
    title: title.trim(),
    status: 'open',
    sortOrder: existing,
    createdAt: new Date().toISOString(),
  }
  await db.milestones.add(milestone)
  return milestone
}

export async function completeMilestone(id: string): Promise<{
  milestone: Milestone
  goal: Goal
  leveledUp: boolean
  previousLevel: number
} | null> {
  const milestone = await db.milestones.get(id)
  if (!milestone || milestone.status === 'done') return null

  const goal = await getGoal(milestone.goalId)
  if (!goal) return null

  const now = new Date().toISOString()
  const updatedMilestone: Milestone = { ...milestone, status: 'done' }
  const previousLevel = goal.level
  const newXp = goal.xp + xpForMilestone()
  const newLevel = levelFromXp(newXp)
  const leveledUp = newLevel > previousLevel
  const updatedGoal: Goal = {
    ...goal,
    xp: newXp,
    level: newLevel,
    lastTouchedAt: now,
  }

  await db.transaction('rw', db.milestones, db.goals, async () => {
    await db.milestones.put(updatedMilestone)
    await db.goals.put(updatedGoal)
  })

  notifyProfileChanged()
  return { milestone: updatedMilestone, goal: updatedGoal, leveledUp, previousLevel }
}

export async function uncompleteMilestone(id: string): Promise<{
  milestone: Milestone
  goal: Goal
} | null> {
  const milestone = await db.milestones.get(id)
  if (!milestone || milestone.status !== 'done') return null

  const goal = await getGoal(milestone.goalId)
  if (!goal) return null

  const updatedMilestone: Milestone = { ...milestone, status: 'open' }
  const newXp = Math.max(0, goal.xp - xpForMilestone())
  const updatedGoal: Goal = {
    ...goal,
    xp: newXp,
    level: levelFromXp(newXp),
  }

  await db.transaction('rw', db.milestones, db.goals, async () => {
    await db.milestones.put(updatedMilestone)
    await db.goals.put(updatedGoal)
  })

  notifyProfileChanged()
  return { milestone: updatedMilestone, goal: updatedGoal }
}

export async function updateGoal(
  id: string,
  patch: Partial<Pick<Goal, 'title' | 'status' | 'pinned'>>,
): Promise<Goal | undefined> {
  const goal = await getGoal(id)
  if (!goal) return undefined
  const updated = { ...goal, ...patch }
  await db.goals.put(updated)
  return updated
}

export async function deleteEntry(id: string): Promise<Goal | undefined> {
  const entry = await db.entries.get(id)
  if (!entry) return undefined

  const goal = await db.goals.get(entry.goalId)
  if (!goal || goal.deletedAt) {
    await db.entries.delete(id)
    return undefined
  }

  const newXp = Math.max(0, goal.xp - xpForKind(entry.kind))
  const updated: Goal = {
    ...goal,
    xp: newXp,
    level: levelFromXp(newXp),
  }

  await db.transaction('rw', db.entries, db.goals, async () => {
    await db.entries.delete(id)
    await db.goals.put(updated)
  })

  notifyProfileChanged()
  return updated
}

export async function deleteMilestone(id: string): Promise<Goal | undefined> {
  const milestone = await db.milestones.get(id)
  if (!milestone) return undefined

  const goal = await db.goals.get(milestone.goalId)

  if (!goal || goal.deletedAt) {
    await db.milestones.delete(id)
    return undefined
  }

  let updated = goal
  if (milestone.status === 'done') {
    const newXp = Math.max(0, goal.xp - xpForMilestone())
    updated = {
      ...goal,
      xp: newXp,
      level: levelFromXp(newXp),
    }
  }

  await db.transaction('rw', db.milestones, db.goals, async () => {
    await db.milestones.delete(id)
    if (updated !== goal) await db.goals.put(updated)
  })

  if (updated !== goal) notifyProfileChanged()
  return updated
}

/** Soft-delete: hide the goal but keep its XP toward the profile total. */
export async function deleteGoal(id: string): Promise<void> {
  await db.transaction('rw', db.goals, db.dailyFocus, async () => {
    const goal = await db.goals.get(id)
    if (!goal || goal.deletedAt) return

    await db.goals.put({
      ...goal,
      deletedAt: new Date().toISOString(),
      pinned: false,
    })

    const focuses = await db.dailyFocus.toArray()
    for (const focus of focuses) {
      if (focus.primaryGoalId !== id && focus.nudgeGoalId !== id) continue
      await db.dailyFocus.put({
        ...focus,
        primaryGoalId: focus.primaryGoalId === id ? null : focus.primaryGoalId,
        nudgeGoalId: focus.nudgeGoalId === id ? null : focus.nudgeGoalId,
      })
    }
  })
  notifyProfileChanged()
}

export async function goalCount(): Promise<number> {
  const goals = await db.goals.toArray()
  return goals.filter(isVisible).length
}
