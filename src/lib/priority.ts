import { db, todayKey, type DailyFocus, type Goal, type Milestone } from '../db/schema'

const FORGOTTEN_DAYS = 14
const MS_DAY = 24 * 60 * 60 * 1000

function daysSince(iso: string, now = Date.now()): number {
  return Math.max(0, (now - new Date(iso).getTime()) / MS_DAY)
}

export function priorityScore(goal: Goal, openMilestones: number, now = Date.now()): number {
  const gap = daysSince(goal.lastTouchedAt, now)
  const pinBoost = goal.pinned ? 1.6 : 1
  const milestoneBoost = 1 + Math.min(openMilestones, 5) * 0.12
  // Prefer goals that need attention but aren't completely abandoned for primary
  const recencyFactor = 1 + Math.min(gap, 21) * 0.08
  return recencyFactor * pinBoost * milestoneBoost
}

export async function ensureDailyFocus(activeGoals: Goal[]): Promise<DailyFocus> {
  const date = todayKey()
  const existing = await db.dailyFocus.get(date)

  // Recompute if missing, or if we had no primary and goals now exist
  const needsRecompute =
    !existing ||
    (existing.primaryGoalId === null && activeGoals.length > 0) ||
    (existing.primaryGoalId !== null &&
      !activeGoals.some((g) => g.id === existing.primaryGoalId))

  if (existing && !needsRecompute) return existing

  const milestones = await db.milestones.toArray()
  const openByGoal = new Map<string, number>()
  for (const m of milestones) {
    if (m.status === 'open') {
      openByGoal.set(m.goalId, (openByGoal.get(m.goalId) ?? 0) + 1)
    }
  }

  const now = Date.now()
  const ranked = [...activeGoals].sort(
    (a, b) =>
      priorityScore(b, openByGoal.get(b.id) ?? 0, now) -
      priorityScore(a, openByGoal.get(a.id) ?? 0, now),
  )

  const primary = ranked[0] ?? null

  const forgotten = activeGoals
    .filter((g) => g.id !== primary?.id)
    .filter((g) => daysSince(g.lastTouchedAt, now) >= FORGOTTEN_DAYS)
    .sort((a, b) => new Date(a.lastTouchedAt).getTime() - new Date(b.lastTouchedAt).getTime())

  const focus: DailyFocus = {
    date,
    primaryGoalId: primary?.id ?? null,
    nudgeGoalId: forgotten[0]?.id ?? null,
  }

  await db.dailyFocus.put(focus)
  return focus
}

export function momentumRatio(lastTouchedAt: string, now = Date.now()): number {
  const days = daysSince(lastTouchedAt, now)
  if (days <= 2) return 1
  if (days >= 21) return 0.08
  return Math.max(0.08, 1 - (days - 2) / 19)
}

export type { Milestone }
