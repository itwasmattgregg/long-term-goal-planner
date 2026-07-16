import { ENTRY_KIND_HELP, type EntryKindInfo, type SlashKind } from './entryKinds'

const SLASH_RE = /^\/([a-z]*)/i

export interface SlashParse {
  /** Cursor is in a leading slash command (no body yet, or incomplete) */
  active: boolean
  query: string
  /** Kind if `/kind` is a complete known command */
  kind: SlashKind | null
  /** Text with leading `/kind` stripped when kind is known */
  body: string
  suggestions: EntryKindInfo[]
}

export function parseSlashInput(text: string): SlashParse {
  const match = text.match(SLASH_RE)
  if (!match) {
    return { active: false, query: '', kind: null, body: text, suggestions: [] }
  }

  const query = match[1]!.toLowerCase()
  const afterSlash = text.slice(1)
  const spaceIdx = afterSlash.search(/\s/)
  const token = spaceIdx === -1 ? afterSlash.toLowerCase() : afterSlash.slice(0, spaceIdx).toLowerCase()
  const hasBodySeparator = spaceIdx !== -1

  const suggestions =
    query.length === 0
      ? ENTRY_KIND_HELP
      : ENTRY_KIND_HELP.filter((k) => k.kind.startsWith(query))

  const exact = ENTRY_KIND_HELP.find((k) => k.kind === token)
  const kind = exact ? exact.kind : null

  // Autocomplete menu stays open until a space follows a complete command
  const active = !hasBodySeparator || !exact

  const body = kind
    ? text.replace(new RegExp(`^/${kind}\\s*`, 'i'), '')
    : text

  return {
    active: Boolean(match) && active,
    query,
    kind,
    body,
    suggestions: active ? suggestions : [],
  }
}

export function applySlashKind(text: string, _kind: SlashKind): string {
  return text.replace(/^\/[a-z]*/i, '').replace(/^\s*/, '')
}
