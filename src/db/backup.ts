import {
  db,
  todayKey,
  type AppMeta,
  type DailyFocus,
  type Entry,
  type Goal,
  type Milestone,
} from './schema'
import { setLastBackupAt } from './operations'

export const BACKUP_APP = 'horizon'
export const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: {
    goals: Goal[]
    entries: Entry[]
    milestones: Milestone[]
    dailyFocus: DailyFocus[]
    meta: AppMeta[]
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export async function exportBackup(): Promise<void> {
  const [goals, entries, milestones, dailyFocus, meta] = await Promise.all([
    db.goals.toArray(),
    db.entries.toArray(),
    db.milestones.toArray(),
    db.dailyFocus.toArray(),
    db.meta.toArray(),
  ])

  const exportedAt = new Date().toISOString()
  const backup: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt,
    data: { goals, entries, milestones, dailyFocus, meta },
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, `horizon-backup-${todayKey()}.json`)
  await setLastBackupAt(exportedAt)
}

export async function parseBackupFile(file: File): Promise<BackupFile> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('That does not look like a Horizon backup.')
  }

  const candidate = parsed as Record<string, unknown>
  if (candidate.app !== BACKUP_APP) {
    throw new Error('That file is not a Horizon backup.')
  }
  if (candidate.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (${String(candidate.version)}).`)
  }
  if (!candidate.data || typeof candidate.data !== 'object') {
    throw new Error('Backup is missing its data section.')
  }

  const data = candidate.data as Record<string, unknown>
  for (const key of ['goals', 'entries', 'milestones', 'dailyFocus', 'meta'] as const) {
    if (!isArray(data[key])) {
      throw new Error(`Backup is missing a valid "${key}" list.`)
    }
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt:
      typeof candidate.exportedAt === 'string' ? candidate.exportedAt : new Date().toISOString(),
    data: {
      goals: data.goals as Goal[],
      entries: data.entries as Entry[],
      milestones: data.milestones as Milestone[],
      dailyFocus: data.dailyFocus as DailyFocus[],
      meta: data.meta as AppMeta[],
    },
  }
}

export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { goals, entries, milestones, dailyFocus, meta } = backup.data

  await db.transaction(
    'rw',
    db.goals,
    db.entries,
    db.milestones,
    db.dailyFocus,
    db.meta,
    async () => {
      await Promise.all([
        db.goals.clear(),
        db.entries.clear(),
        db.milestones.clear(),
        db.dailyFocus.clear(),
        db.meta.clear(),
      ])
      if (goals.length) await db.goals.bulkAdd(goals)
      if (entries.length) await db.entries.bulkAdd(entries)
      if (milestones.length) await db.milestones.bulkAdd(milestones)
      if (dailyFocus.length) await db.dailyFocus.bulkAdd(dailyFocus)
      if (meta.length) await db.meta.bulkAdd(meta)
    },
  )
}

function formatDate(iso: string): string {
  const d = iso.slice(0, 10)
  return d || iso
}

function renderGoalSection(goal: Goal, milestones: Milestone[], entries: Entry[]): string {
  const lines: string[] = []
  lines.push(`## ${goal.title}`)
  lines.push('')
  lines.push(
    `${goal.status} · level ${goal.level} · created ${formatDate(goal.createdAt)}${
      goal.deletedAt ? ` · archived ${formatDate(goal.deletedAt)}` : ''
    }`,
  )
  lines.push('')

  if (milestones.length > 0) {
    lines.push('### Milestones')
    lines.push('')
    for (const m of milestones) {
      const box = m.status === 'done' ? '[x]' : '[ ]'
      lines.push(`- ${box} ${m.title}`)
    }
    lines.push('')
  }

  if (entries.length > 0) {
    lines.push('### Journal')
    lines.push('')
    const chronological = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    for (const e of chronological) {
      lines.push(`**${formatDate(e.createdAt)}** _(${e.kind})_ — ${e.rawText}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

export async function exportMarkdown(): Promise<void> {
  const [allGoals, allEntries, allMilestones] = await Promise.all([
    db.goals.toArray(),
    db.entries.toArray(),
    db.milestones.toArray(),
  ])

  const entriesByGoal = new Map<string, Entry[]>()
  for (const entry of allEntries) {
    const list = entriesByGoal.get(entry.goalId) ?? []
    list.push(entry)
    entriesByGoal.set(entry.goalId, list)
  }

  const milestonesByGoal = new Map<string, Milestone[]>()
  for (const milestone of allMilestones) {
    const list = milestonesByGoal.get(milestone.goalId) ?? []
    list.push(milestone)
    milestonesByGoal.set(milestone.goalId, list)
  }

  const sortMilestones = (list: Milestone[]) =>
    [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))

  const byTouched = (a: Goal, b: Goal) => b.lastTouchedAt.localeCompare(a.lastTouchedAt)
  const active = allGoals.filter((g) => !g.deletedAt).sort(byTouched)
  const archived = allGoals.filter((g) => !!g.deletedAt).sort(byTouched)

  const parts: string[] = []
  parts.push('# Horizon export')
  parts.push('')
  parts.push(`Exported ${formatDate(new Date().toISOString())}.`)
  parts.push('')

  if (active.length === 0 && archived.length === 0) {
    parts.push('_No goals yet._')
    parts.push('')
  }

  for (const goal of active) {
    parts.push(
      renderGoalSection(
        goal,
        sortMilestones(milestonesByGoal.get(goal.id) ?? []),
        entriesByGoal.get(goal.id) ?? [],
      ),
    )
  }

  if (archived.length > 0) {
    parts.push('# Archived')
    parts.push('')
    for (const goal of archived) {
      parts.push(
        renderGoalSection(
          goal,
          sortMilestones(milestonesByGoal.get(goal.id) ?? []),
          entriesByGoal.get(goal.id) ?? [],
        ),
      )
    }
  }

  const blob = new Blob([parts.join('\n').trimEnd() + '\n'], {
    type: 'text/markdown;charset=utf-8',
  })
  downloadBlob(blob, `horizon-export-${todayKey()}.md`)
}
