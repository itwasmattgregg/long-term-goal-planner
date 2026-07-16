import { ENTRY_KIND_HELP } from '../lib/entryKinds'
import { cuePhrasesFor, type CueKind } from '../lib/parseEntry'
import './JournalHelp.css'

interface JournalHelpProps {
  open: boolean
  onClose: () => void
}

function isCueKind(kind: string): kind is CueKind {
  return kind === 'success' || kind === 'failure' || kind === 'decision'
}

export function JournalHelp({ open, onClose }: JournalHelpProps) {
  if (!open) return null

  return (
    <div className="journal-help" role="dialog" aria-modal="true" aria-labelledby="journal-help-title">
      <div className="journal-help__backdrop" onClick={onClose} />
      <div className="journal-help__panel">
        <div className="journal-help__panel-inner">
          <header className="journal-help__header">
            <div>
              <p className="journal-help__kicker">Journal</p>
              <h2 id="journal-help-title">Entry types</h2>
            </div>
            <button type="button" className="journal-help__close" onClick={onClose} aria-label="Close help">
              Esc
            </button>
          </header>

          <p className="journal-help__lead">
            Start a line with <kbd>/</kbd> to pick a type, or let Horizon guess from your wording.
            Press <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> anytime for this guide.
          </p>

          <ul className="journal-help__list">
            {ENTRY_KIND_HELP.map((item) => {
              const cues = isCueKind(item.kind) ? cuePhrasesFor(item.kind) : []
              return (
                <li key={item.kind} className={`journal-help__item journal-help__item--${item.kind}`}>
                  <div className="journal-help__item-head">
                    <span className="journal-help__slash">{item.slash}</span>
                    <span className="journal-help__label">{item.label}</span>
                  </div>
                  <p className="journal-help__summary">{item.summary}</p>
                  {cues.length > 0 && (
                    <ul className="journal-help__cues" aria-label={`Words that mark a ${item.label.toLowerCase()}`}>
                      {cues.map((phrase) => (
                        <li key={phrase}>
                          <span className={`journal-help__cue journal-help__cue--${item.kind}`}>{phrase}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="journal-help__example">{item.example}</p>
                </li>
              )
            })}
          </ul>

          <p className="journal-help__foot">
            Creating a brand-new goal tags the first entry as <strong>goal created</strong> automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
