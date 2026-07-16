import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from 'react'
import {
  createGoal,
  getActiveGoals,
  getEntriesForGoal,
  saveEntry,
} from '../db/operations'
import { findCueMatches, inferCueKind, parseEntry, tokenize } from '../lib/parseEntry'
import { AMBIGUOUS_MATCH, HIGH_MATCH, matchGoals } from '../lib/matchGoal'
import { formatEntryKind, type SlashKind } from '../lib/entryKinds'
import { applySlashKind, parseSlashInput } from '../lib/slashCommand'
import { ConfirmMatch, type ConfirmAction } from './ConfirmMatch'
import { JournalHelp } from './JournalHelp'
import type { SaveEntryResult } from '../db/operations'
import type { EntryKind } from '../db/schema'
import './Composer.css'

function renderCueHighlights(value: string): ReactNode {
  const matches = findCueMatches(value)
  if (matches.length === 0) return value

  const nodes: ReactNode[] = []
  let cursor = 0
  matches.forEach((match, i) => {
    if (match.start > cursor) nodes.push(value.slice(cursor, match.start))
    nodes.push(
      <mark key={`${match.start}-${i}`} className={`composer__cue composer__cue--${match.kind}`}>
        {value.slice(match.start, match.end)}
      </mark>,
    )
    cursor = match.end
  })
  if (cursor < value.length) nodes.push(value.slice(cursor))
  // Trailing newline doesn't expand height in a div unless mirrored.
  if (value.endsWith('\n')) nodes.push('\n')
  return nodes
}

interface ComposerProps {
  placeholder?: string
  initialText?: string
  prelinkedGoalId?: string | null
  forceKind?: 'checkin'
  onSaved: (result: SaveEntryResult) => void
}

export function Composer({
  placeholder = 'What’s on your mind?',
  initialText = '',
  prelinkedGoalId = null,
  forceKind,
  onSaved,
}: ComposerProps) {
  const [text, setText] = useState(initialText)
  const [slashKind, setSlashKind] = useState<SlashKind | null>(null)
  const [pending, setPending] = useState<ReturnType<typeof parseEntry> | null>(null)
  const [matches, setMatches] = useState<ReturnType<typeof matchGoals>>([])
  const [busy, setBusy] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const slash = parseSlashInput(text)
  const showSuggestions = !pending && slash.active && slash.suggestions.length > 0 && !slashKind
  const cueHighlight = renderCueHighlights(text)

  useEffect(() => {
    setText(initialText)
  }, [initialText])

  useEffect(() => {
    setActiveSuggestion(0)
  }, [slash.query, showSuggestions])

  useEffect(() => {
    const onFocus = () => document.body.classList.add('composer-focus')
    const onBlur = () => document.body.classList.remove('composer-focus')
    const el = taRef.current
    el?.addEventListener('focus', onFocus)
    el?.addEventListener('blur', onBlur)
    return () => {
      el?.removeEventListener('focus', onFocus)
      el?.removeEventListener('blur', onBlur)
      document.body.classList.remove('composer-focus')
    }
  }, [])

  useEffect(() => {
    function onGlobalKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setHelpOpen((open) => !open)
      }
      if (e.key === 'Escape' && helpOpen) {
        e.preventDefault()
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', onGlobalKey)
    return () => window.removeEventListener('keydown', onGlobalKey)
  }, [helpOpen])

  function pickSuggestion(kind: SlashKind) {
    const next = applySlashKind(text, kind)
    setSlashKind(kind)
    setText(next)
    requestAnimationFrame(() => taRef.current?.focus())
  }

  function clearSlashKind() {
    setSlashKind(null)
  }

  function onTextChange(value: string) {
    setText(value)
    const parsed = parseSlashInput(value)
    if (parsed.kind && value.match(new RegExp(`^/${parsed.kind}\\s`, 'i'))) {
      setSlashKind(parsed.kind)
      setText(parsed.body)
    } else if (slashKind && value.startsWith('/')) {
      // User started a new slash — clear pinned kind
      setSlashKind(null)
    }
  }

  function syncHighlightScroll(e: UIEvent<HTMLTextAreaElement>) {
    const backdrop = highlightRef.current
    if (!backdrop) return
    backdrop.scrollTop = e.currentTarget.scrollTop
    backdrop.scrollLeft = e.currentTarget.scrollLeft
  }

  function resolveKind(parsedKind: EntryKind): EntryKind {
    if (forceKind) return forceKind
    if (slashKind) return slashKind
    return parsedKind
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (showSuggestions) return

    const slashNow = parseSlashInput(text)
    const raw = (slashKind ? text : slashNow.kind ? slashNow.body : text).trim()
    if (!raw || busy) return

    const parsed = parseEntry(raw)
    parsed.kind = resolveKind(slashNow.kind ?? parsed.kind)

    if (prelinkedGoalId) {
      setBusy(true)
      try {
        const result = await saveEntry(prelinkedGoalId, raw, parsed.kind)
        setText('')
        setSlashKind(null)
        setPending(null)
        onSaved(result)
      } finally {
        setBusy(false)
      }
      return
    }

    const goals = await getActiveGoals()
    const keywordsByGoal: Record<string, string[]> = {}
    await Promise.all(
      goals.map(async (g) => {
        const entries = await getEntriesForGoal(g.id)
        keywordsByGoal[g.id] = entries.slice(0, 5).flatMap((en) => tokenize(en.rawText))
      }),
    )

    const scored = matchGoals(parsed.tokens, parsed.rawText, goals, keywordsByGoal)
    setMatches(scored)
    setPending(parsed)
  }

  async function handleConfirm(action: ConfirmAction) {
    if (!pending) return
    setBusy(true)
    try {
      if (action.type === 'create') {
        const goal = await createGoal(action.title)
        const result = await saveEntry(goal.id, pending.rawText, 'created')
        setText('')
        setSlashKind(null)
        setPending(null)
        setMatches([])
        onSaved(result)
        return
      }
      const result = await saveEntry(action.goalId, pending.rawText, action.kind)
      setText('')
      setSlashKind(null)
      setPending(null)
      setMatches([])
      onSaved(result)
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion((i) => (i + 1) % slash.suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion((i) => (i - 1 + slash.suggestions.length) % slash.suggestions.length)
        return
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        const pick = slash.suggestions[activeSuggestion]
        if (pick) {
          e.preventDefault()
          pickSuggestion(pick.kind)
          return
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setText(text.replace(/^\/[a-z]*/i, ''))
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  const top = matches[0]
  const high = !!top && top.score >= HIGH_MATCH
  const ambiguous = !!top && top.score >= AMBIGUOUS_MATCH && top.score < HIGH_MATCH
  const pinnedKind = slashKind ?? forceKind ?? null
  const kindChip = pinnedKind ?? (showSuggestions ? null : inferCueKind(text))
  const kindChipClearable = !!slashKind

  return (
    <div className="composer">
      {!pending ? (
        <form className="composer__form" onSubmit={(e) => void submit(e)}>
          <div className="composer__toolbar">
            <button
              type="button"
              className="composer__help-btn"
              onClick={() => setHelpOpen(true)}
              aria-label="Journal entry types help"
              title="Entry types (⌘K)"
            >
              <span aria-hidden>/</span> Types
            </button>
            {kindChip &&
              (kindChipClearable ? (
                <button
                  type="button"
                  className={`composer__kind-chip composer__kind-chip--${kindChip}`}
                  onClick={clearSlashKind}
                >
                  {formatEntryKind(kindChip)}
                  <span className="composer__kind-clear">×</span>
                </button>
              ) : (
                <span className={`composer__kind-chip composer__kind-chip--${kindChip}`}>
                  {formatEntryKind(kindChip)}
                </span>
              ))}
          </div>

          <div className="composer__field">
            <label className="sr-only" htmlFor="composer-input">
              Journal entry
            </label>
            <div className="composer__input-shell">
              <div ref={highlightRef} className="composer__highlight" aria-hidden>
                {cueHighlight}
              </div>
              <textarea
                id="composer-input"
                ref={taRef}
                className="composer__input"
                rows={3}
                placeholder={placeholder}
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                onKeyDown={onKeyDown}
                onScroll={syncHighlightScroll}
              />
            </div>

            {showSuggestions && (
              <ul className="composer__suggest" role="listbox" aria-label="Entry types">
                {slash.suggestions.map((item, i) => (
                  <li key={item.kind}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === activeSuggestion}
                      className={i === activeSuggestion ? 'is-active' : undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(item.kind)}
                    >
                      <span className="composer__suggest-slash">{item.slash}</span>
                      <span className="composer__suggest-meta">
                        <strong>{item.label}</strong>
                        <span>{item.summary}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="composer__actions">
            <p className="composer__hint">
              Type <kbd>/</kbd> for types · <kbd>⌘K</kbd> help
            </p>
            <button type="submit" className="btn btn--primary composer__submit" disabled={!text.trim() || busy || showSuggestions}>
              Save
            </button>
          </div>
        </form>
      ) : (
        <ConfirmMatch
          parsed={pending}
          matches={matches}
          high={high}
          ambiguous={ambiguous}
          onConfirm={(a) => void handleConfirm(a)}
          onCancel={() => {
            setPending(null)
            setMatches([])
          }}
        />
      )}

      <JournalHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
