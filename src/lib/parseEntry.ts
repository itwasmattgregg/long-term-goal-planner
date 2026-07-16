import type { EntryKind } from '../db/schema'

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'i', 'me', 'my', 'we', 'our', 'you',
  'your', 'it', 'its', 'this', 'that', 'from', 'as', 'by', 'about', 'into', 'over',
  'after', 'before', 'so', 'if', 'then', 'than', 'too', 'very', 'just', 'not', 'no',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should',
  'im', "i'm", 'ive', "i've", 'id', "i'd", 'ill', "i'll",
])

export interface ParsedEntry {
  rawText: string
  tokens: string[]
  kind: EntryKind
  suggestsNewGoal: boolean
  suggestedTitle: string
}

export type CueKind = 'success' | 'failure' | 'decision'

export interface CueMatch {
  start: number
  end: number
  kind: CueKind
}

const NEW_GOAL_CUES = [
  /\bi want to\b/i,
  /\bmy goal is\b/i,
  /\bi['’]?m going to\b/i,
  /\bplan to\b/i,
  /\bi['’]?ve decided i want\b/i,
  /\bstarting today i\b/i,
]

/** Patterns used for both kind inference and live highlighting. */
const CUE_PATTERNS: { kind: CueKind; source: string; phrase: string }[] = [
  { kind: 'success', source: String.raw`\bdid it\b`, phrase: 'did it' },
  { kind: 'success', source: String.raw`\bfinished\b`, phrase: 'finished' },
  { kind: 'success', source: String.raw`\bsucceeded\b`, phrase: 'succeeded' },
  { kind: 'success', source: String.raw`\bnailed\b`, phrase: 'nailed' },
  { kind: 'success', source: String.raw`\bcompleted\b`, phrase: 'completed' },
  { kind: 'success', source: String.raw`\bcrushed it\b`, phrase: 'crushed it' },
  { kind: 'success', source: String.raw`\bwrote\b`, phrase: 'wrote' },
  { kind: 'success', source: String.raw`\bsaved\b`, phrase: 'saved' },
  { kind: 'failure', source: String.raw`\bfailed\b`, phrase: 'failed' },
  { kind: 'failure', source: String.raw`\bmissed\b`, phrase: 'missed' },
  { kind: 'failure', source: String.raw`\bcouldn['’]?t\b`, phrase: "couldn't" },
  { kind: 'failure', source: String.raw`\bslipped\b`, phrase: 'slipped' },
  { kind: 'failure', source: String.raw`\brelapsed\b`, phrase: 'relapsed' },
  { kind: 'failure', source: String.raw`\bdidn['’]?t\b`, phrase: "didn't" },
  { kind: 'failure', source: String.raw`\bfell short\b`, phrase: 'fell short' },
  { kind: 'decision', source: String.raw`\bdecided\b`, phrase: 'decided' },
  { kind: 'decision', source: String.raw`\bchose\b`, phrase: 'chose' },
  { kind: 'decision', source: String.raw`\bgoing with\b`, phrase: 'going with' },
  { kind: 'decision', source: String.raw`\bpicked\b`, phrase: 'picked' },
  { kind: 'decision', source: String.raw`\bcommitted to\b`, phrase: 'committed to' },
]

const KIND_PRIORITY: CueKind[] = ['success', 'failure', 'decision']

export function cuePhrasesFor(kind: CueKind): string[] {
  return CUE_PATTERNS.filter((p) => p.kind === kind).map((p) => p.phrase)
}

export function findCueMatches(text: string): CueMatch[] {
  const found: CueMatch[] = []
  for (const { kind, source } of CUE_PATTERNS) {
    const re = new RegExp(source, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      found.push({ start: m.index, end: m.index + m[0].length, kind })
      if (m[0].length === 0) re.lastIndex += 1
    }
  }

  found.sort((a, b) => a.start - b.start || b.end - a.end || KIND_PRIORITY.indexOf(a.kind) - KIND_PRIORITY.indexOf(b.kind))

  const result: CueMatch[] = []
  let lastEnd = 0
  for (const match of found) {
    if (match.start >= lastEnd) {
      result.push(match)
      lastEnd = match.end
    }
  }
  return result
}

function kindFromCues(text: string): EntryKind {
  for (const kind of KIND_PRIORITY) {
    if (CUE_PATTERNS.some((p) => p.kind === kind && new RegExp(p.source, 'i').test(text))) {
      return kind
    }
  }
  return 'update'
}

/** Cue-based kind that will be saved, or null when nothing special is detected. */
export function inferCueKind(text: string): CueKind | null {
  const kind = kindFromCues(text)
  return kind === 'update' ? null : kind
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

function suggestTitle(text: string): string {
  let t = text.trim()
  t = t.replace(/^(i want to|my goal is to|my goal is|i'm going to|im going to|plan to)\s+/i, '')
  t = t.replace(/[.!?]+$/, '')
  if (!t) return text.trim().slice(0, 60)
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function parseEntry(rawText: string): ParsedEntry {
  const text = rawText.trim()
  const tokens = tokenize(text)
  const suggestsNewGoal = NEW_GOAL_CUES.some((re) => re.test(text))

  let kind: EntryKind = kindFromCues(text)
  if (kind === 'update' && suggestsNewGoal) kind = 'update'

  return {
    rawText: text,
    tokens,
    kind,
    suggestsNewGoal,
    suggestedTitle: suggestTitle(text),
  }
}
