import { useState } from 'react'
import type { EntryKind } from '../db/schema'
import type { Goal } from '../db/schema'
import type { ParsedEntry } from '../lib/parseEntry'
import type { GoalMatch } from '../lib/matchGoal'
import './ConfirmMatch.css'

export type ConfirmAction =
  | { type: 'attach'; goalId: string; kind: EntryKind }
  | { type: 'create'; title: string; kind: EntryKind }

interface ConfirmMatchProps {
  parsed: ParsedEntry
  matches: GoalMatch[]
  high: boolean
  ambiguous: boolean
  onConfirm: (action: ConfirmAction) => void
  onCancel: () => void
}

const KINDS: EntryKind[] = ['update', 'success', 'failure', 'decision', 'checkin']

export function ConfirmMatch({
  parsed,
  matches,
  high,
  ambiguous,
  onConfirm,
  onCancel,
}: ConfirmMatchProps) {
  const [kind, setKind] = useState<EntryKind>(parsed.kind)
  const [title, setTitle] = useState(parsed.suggestedTitle)
  const top = matches[0]

  const showCreateFirst = parsed.suggestsNewGoal && !high
  const showPicker = ambiguous || (!high && !showCreateFirst && matches.length > 0)

  return (
    <div className="confirm" role="dialog" aria-labelledby="confirm-title">
      <p className="confirm__quote">“{parsed.rawText}”</p>

      <label className="confirm__kind">
        <span>This feels like</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as EntryKind)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      {high && top && (
        <>
          <h2 id="confirm-title" className="confirm__heading">
            Attach to <em>{top.goal.title}</em>?
          </h2>
          <div className="confirm__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onConfirm({ type: 'attach', goalId: top.goal.id, kind })}
            >
              Attach
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onConfirm({ type: 'create', title, kind })}
            >
              New goal instead
            </button>
          </div>
          {matches.length > 1 && (
            <GoalPicker
              matches={matches.slice(0, 3)}
              onPick={(g) => onConfirm({ type: 'attach', goalId: g.id, kind })}
            />
          )}
        </>
      )}

      {showCreateFirst && (
        <>
          <h2 id="confirm-title" className="confirm__heading">
            Create a new goal?
          </h2>
          <label className="confirm__title-field">
            <span className="sr-only">Goal title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="confirm__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!title.trim()}
              onClick={() => onConfirm({ type: 'create', title: title.trim(), kind })}
            >
              Create goal
            </button>
            {top && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onConfirm({ type: 'attach', goalId: top.goal.id, kind })}
              >
                Attach to {top.goal.title}
              </button>
            )}
          </div>
        </>
      )}

      {showPicker && !showCreateFirst && (
        <>
          <h2 id="confirm-title" className="confirm__heading">
            Which goal is this about?
          </h2>
          <GoalPicker
            matches={matches.slice(0, 3)}
            onPick={(g) => onConfirm({ type: 'attach', goalId: g.id, kind })}
          />
          <label className="confirm__title-field">
            <span>Or name a new goal</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="confirm__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!title.trim()}
              onClick={() => onConfirm({ type: 'create', title: title.trim(), kind })}
            >
              New goal
            </button>
          </div>
        </>
      )}

      {!high && !showCreateFirst && !showPicker && (
        <>
          <h2 id="confirm-title" className="confirm__heading">
            Create a new goal?
          </h2>
          <label className="confirm__title-field">
            <span className="sr-only">Goal title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="confirm__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!title.trim()}
              onClick={() => onConfirm({ type: 'create', title: title.trim(), kind })}
            >
              Create goal
            </button>
          </div>
        </>
      )}

      <button type="button" className="confirm__cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}

function GoalPicker({
  matches,
  onPick,
}: {
  matches: GoalMatch[]
  onPick: (goal: Goal) => void
}) {
  return (
    <ul className="confirm__picker">
      {matches.map((m) => (
        <li key={m.goal.id}>
          <button type="button" onClick={() => onPick(m.goal)}>
            {m.goal.title}
          </button>
        </li>
      ))}
    </ul>
  )
}
