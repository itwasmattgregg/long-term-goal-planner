import type { EntryKind } from '../db/schema'

export type SlashKind = Exclude<EntryKind, 'created'>

export interface EntryKindInfo {
  kind: SlashKind
  slash: string
  label: string
  summary: string
  example: string
}

/** Journal types you can pick with /commands (not auto "created"). */
export const ENTRY_KIND_HELP: EntryKindInfo[] = [
  {
    kind: 'update',
    slash: '/update',
    label: 'Update',
    summary: 'A progress note, thought, or anything in between.',
    example: '/update Looked at three neighborhoods this weekend.',
  },
  {
    kind: 'success',
    slash: '/success',
    label: 'Success',
    summary: 'Something went right — a win worth remembering.',
    example: '/success Finished the down-payment spreadsheet.',
  },
  {
    kind: 'failure',
    slash: '/failure',
    label: 'Failure',
    summary: 'A miss or slip. Logging it still earns a little XP.',
    example: '/failure Skipped the gym three days in a row.',
  },
  {
    kind: 'decision',
    slash: '/decision',
    label: 'Decision',
    summary: 'A choice you made that shapes the path ahead.',
    example: '/decision Going with the smaller house nearer work.',
  },
  {
    kind: 'checkin',
    slash: '/checkin',
    label: 'Check-in',
    summary: 'A quick pulse on how a goal is feeling today.',
    example: '/checkin Feeling steady about the promotion path.',
  },
]

export function formatEntryKind(kind: EntryKind): string {
  switch (kind) {
    case 'created':
      return 'goal created'
    case 'checkin':
      return 'check-in'
    default:
      return kind
  }
}
