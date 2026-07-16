import { PROFILE_LADDER_LEVELS, xpRequiredForLevel } from './xp'

export type LevelSystemId = 'classic' | 'arcane' | 'might' | 'dawn' | 'trail'

export interface LevelSystem {
  id: LevelSystemId
  name: string
  tagline: string
  blurb: string
  /** Short prefix shown on the header badge (e.g. Lv, Rank). */
  badgeLabel: string
  /** Rank titles starting at level 1. Missing later levels use `beyond`. */
  titles: string[]
  beyond: (level: number) => string
}

export interface LadderRung {
  level: number
  title: string
  xpRequired: number
}

export const LEVEL_SYSTEMS: LevelSystem[] = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Numbers. Clean. Relentless.',
    blurb: 'The honest climb. No costumes — just the next rung and the XP it costs to stand on it.',
    badgeLabel: 'Lv',
    titles: [],
    beyond: (level) => `Level ${level}`,
  },
  {
    id: 'arcane',
    name: 'Arcane',
    tagline: 'You are becoming suspiciously sparkly.',
    blurb: 'Journal enough and the universe starts treating you like a wizard with a filing system.',
    badgeLabel: 'Rank',
    titles: [
      'Spark',
      'Wicklighter',
      'Cantrip Kid',
      'Hexling',
      'Spellstitcher',
      'Rune Runner',
      'Stormcaller',
      'High Magus',
      'Archmage',
      'Starweaver',
      'Reality Bender',
      'Mythwright',
      'Astral Clerk',
      'Cosmic Scribbler',
      'Omnimancer',
      'The Plot Device',
    ],
    beyond: (level) => `Elder Myth ${level}`,
  },
  {
    id: 'might',
    name: 'Might',
    tagline: 'Gains, but for your future self.',
    blurb: 'Every logged win is a rep. Every honest failure still counts — sore today, legendary later.',
    badgeLabel: 'Form',
    titles: [
      'Soft Hands',
      'Warmup',
      'Callused',
      'Contender',
      'Ironwill',
      'Peak Form',
      'Unbreakable',
      'Titan',
      'Colossus',
      'Force of Nature',
      'Living Legend',
      'World Presser',
      'Gravity Optional',
      'Demigod of Doing',
      'Mythic Bulk',
      'Final Boss Energy',
    ],
    beyond: (level) => `Ascended Titan ${level}`,
  },
  {
    id: 'dawn',
    name: 'Dawn',
    tagline: 'Enlightenment, one sentence at a time.',
    blurb: 'Not louder — clearer. Your goals stop shouting and start glowing at the edges.',
    badgeLabel: 'Stage',
    titles: [
      'Glimmer',
      'Soft Gaze',
      'Seeker',
      'Clear Eyes',
      'Quiet Mind',
      'Open Path',
      'Still Water',
      'Inner Horizon',
      'Luminous',
      'Awakened',
      'Boundless',
      'Sky-Minded',
      'Unhurried Sage',
      'Morning Eternal',
      'Witness of Years',
      'The Quiet Sun',
    ],
    beyond: (level) => `Radiant ${level}`,
  },
  {
    id: 'trail',
    name: 'Trail',
    tagline: 'Long roads love stubborn feet.',
    blurb: 'Horizon is a trail marker. Keep walking — the view upgrades with your mileage.',
    badgeLabel: 'Mark',
    titles: [
      'First Step',
      'Dusty Boots',
      'Pathfinder',
      'Ridge Walker',
      'Trail Guide',
      'Weatherworn',
      'Summit Scout',
      'Skyline Keeper',
      'Horizon Touched',
      'World Crosser',
      'Eternal Wanderer',
      'Mapmaker',
      'Compass Heart',
      'Far Ridge',
      'Edge of Maps',
      'Where Roads End',
    ],
    beyond: (level) => `Beyond the Map ${level}`,
  },
]

export const DEFAULT_LEVEL_SYSTEM_ID: LevelSystemId = 'classic'

export function getLevelSystem(id: string | null | undefined): LevelSystem {
  return LEVEL_SYSTEMS.find((s) => s.id === id) ?? LEVEL_SYSTEMS[0]!
}

export function titleForLevel(system: LevelSystem, level: number): string {
  const titled = system.titles[level - 1]
  if (titled) return titled
  if (system.id === 'classic') return `Level ${level}`
  return system.beyond(level)
}

export function buildLadder(
  system: LevelSystem,
  upToLevel = PROFILE_LADDER_LEVELS,
): LadderRung[] {
  const rungs: LadderRung[] = []
  for (let level = 1; level <= upToLevel; level++) {
    rungs.push({
      level,
      title: titleForLevel(system, level),
      xpRequired: xpRequiredForLevel(level),
    })
  }
  return rungs
}

export function badgeText(system: LevelSystem, level: number): { label: string; value: string } {
  if (system.id === 'classic') {
    return { label: system.badgeLabel, value: String(level) }
  }
  return { label: system.badgeLabel, value: titleForLevel(system, level) }
}
