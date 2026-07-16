import type { EntryKind } from '../db/schema'

/** Cumulative XP required to reach each level (level 1 starts at 0). */
export const XP_THRESHOLDS = [0, 50, 120, 220, 350, 520, 740, 1000, 1320, 1700, 2150] as const

/** How many ladder rungs to show in the profile help overlay. */
export const PROFILE_LADDER_LEVELS = 16

export function xpForKind(kind: EntryKind): number {
  switch (kind) {
    case 'success':
      return 18
    case 'decision':
      return 12
    case 'created':
      return 15
    case 'failure':
      return 6
    case 'checkin':
      return 8
    case 'update':
    default:
      return 10
  }
}

export function xpForMilestone(): number {
  return 25
}

/** Cumulative XP needed to reach a given level. */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  if (level <= XP_THRESHOLDS.length) return XP_THRESHOLDS[level - 1]!
  return XP_THRESHOLDS[XP_THRESHOLDS.length - 1]! + (level - XP_THRESHOLDS.length) * 500
}

export function levelFromXp(xp: number): number {
  let level = 1
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]!) level = i + 1
    else break
  }
  const last = XP_THRESHOLDS[XP_THRESHOLDS.length - 1]!
  if (xp >= last) {
    const extra = xp - last
    level = XP_THRESHOLDS.length + Math.floor(extra / 500)
  }
  return level
}

export function xpProgress(xp: number): { level: number; into: number; need: number; ratio: number } {
  const level = levelFromXp(xp)
  let floor: number
  let ceil: number

  if (level < XP_THRESHOLDS.length) {
    floor = XP_THRESHOLDS[level - 1]!
    ceil = XP_THRESHOLDS[level]!
  } else if (level === XP_THRESHOLDS.length) {
    floor = XP_THRESHOLDS[XP_THRESHOLDS.length - 1]!
    ceil = floor + 500
  } else {
    floor = XP_THRESHOLDS[XP_THRESHOLDS.length - 1]! + (level - XP_THRESHOLDS.length) * 500
    ceil = floor + 500
  }

  const into = Math.max(0, xp - floor)
  const need = Math.max(1, ceil - floor)
  return { level, into, need, ratio: Math.min(1, into / need) }
}

