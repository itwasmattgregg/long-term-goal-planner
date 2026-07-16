import type { Goal } from '../db/schema'
import { tokenize } from './parseEntry'

export interface GoalMatch {
  goal: Goal
  score: number
}

function bigrams(s: string): Set<string> {
  const t = s.toLowerCase()
  const set = new Set<string>()
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2))
  return set
}

function dice(a: string, b: string): number {
  const A = bigrams(a)
  const B = bigrams(b)
  if (A.size === 0 || B.size === 0) return 0
  let overlap = 0
  for (const x of A) if (B.has(x)) overlap++
  return (2 * overlap) / (A.size + B.size)
}

function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const B = new Set(b)
  let hits = 0
  for (const t of a) if (B.has(t)) hits++
  return hits / Math.max(a.length, 1)
}

export function scoreGoal(
  entryTokens: string[],
  entryText: string,
  goal: Goal,
  recentKeywords: string[] = [],
): number {
  const titleTokens = tokenize(goal.title)
  const overlap = tokenOverlap(entryTokens, [...titleTokens, ...recentKeywords])
  const fuzzy = dice(entryText, goal.title)
  return overlap * 0.65 + fuzzy * 0.35
}

export const HIGH_MATCH = 0.35
export const AMBIGUOUS_MATCH = 0.18

export function matchGoals(
  entryTokens: string[],
  entryText: string,
  goals: Goal[],
  keywordsByGoal: Record<string, string[]> = {},
): GoalMatch[] {
  return goals
    .map((goal) => ({
      goal,
      score: scoreGoal(entryTokens, entryText, goal, keywordsByGoal[goal.id] ?? []),
    }))
    .filter((m) => m.score > 0.05)
    .sort((a, b) => b.score - a.score)
}
