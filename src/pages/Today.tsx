import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Composer } from '../components/Composer'
import { GoalRing } from '../components/GoalRing'
import { ToastHost, useToasts } from '../components/Toast'
import {
  getActiveGoals,
  getGoal,
  getRecentEntries,
  type SaveEntryResult,
} from '../db/operations'
import { ensureDailyFocus } from '../lib/priority'
import { formatEntryKind } from '../lib/entryKinds'
import type { Entry, Goal } from '../db/schema'
import './Today.css'

export function Today() {
  const location = useLocation()
  const draft = (location.state as { draft?: string } | null)?.draft ?? ''
  const { toasts, push, dismiss } = useToasts()

  const [primary, setPrimary] = useState<Goal | null>(null)
  const [nudge, setNudge] = useState<Goal | null>(null)
  const [recent, setRecent] = useState<Entry[]>([])
  const [flashId, setFlashId] = useState<string | null>(null)
  const [liftId, setLiftId] = useState<string | null>(null)
  /** Only set when the user explicitly chooses a goal via Write */
  const [linkedId, setLinkedId] = useState<string | null>(null)
  const [showCheckinPrompt, setShowCheckinPrompt] = useState(true)

  const refresh = useCallback(async () => {
    const active = await getActiveGoals()
    const focus = await ensureDailyFocus(active)
    const p = focus.primaryGoalId ? ((await getGoal(focus.primaryGoalId)) ?? null) : null
    const n = focus.nudgeGoalId ? ((await getGoal(focus.nudgeGoalId)) ?? null) : null
    setPrimary(p)
    setNudge(n)
    setRecent(await getRecentEntries(4))
    if (!p) setShowCheckinPrompt(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function handleSaved(result: SaveEntryResult) {
    setFlashId(result.goal.id)
    window.setTimeout(() => setFlashId(null), 800)
    if (result.leveledUp) {
      setLiftId(result.goal.id)
      push(`${result.goal.title} reached level ${result.goal.level}`, 'levelup')
      window.setTimeout(() => setLiftId(null), 900)
    } else {
      push(`Logged · +XP`)
    }
    setLinkedId(null)
    setShowCheckinPrompt(false)
    void refresh()
  }

  const linkedGoal =
    linkedId === primary?.id
      ? primary
      : linkedId === nudge?.id
        ? nudge
        : null

  const headingGoal = linkedGoal ?? (showCheckinPrompt ? primary : null)

  return (
    <div className="today">
      <header className="today__header">
        {headingGoal ? (
          <h1 className={liftId === headingGoal.id ? 'today__title today__title--lift' : 'today__title'}>
            How’s it going on <em>{headingGoal.title}</em>?
          </h1>
        ) : (
          <h1 className="today__title">What’s on your mind?</h1>
        )}
        {linkedGoal ? (
          <button type="button" className="today__soft" onClick={() => setLinkedId(null)}>
            Write about anything
          </button>
        ) : primary && !showCheckinPrompt ? (
          <button type="button" className="today__soft" onClick={() => setShowCheckinPrompt(true)}>
            Check in on {primary.title}
          </button>
        ) : primary && showCheckinPrompt ? (
          <p className="today__hint">Save anything — we’ll ask which goal it belongs to.</p>
        ) : null}
      </header>

      <Composer
        initialText={draft}
        placeholder={
          linkedGoal
            ? `A note about ${linkedGoal.title}…`
            : 'What’s on your mind?'
        }
        prelinkedGoalId={linkedId}
        onSaved={handleSaved}
      />

      {(primary || nudge) && (
        <section className="today__focus" aria-label="Today’s focus">
          {primary && (
            <FocusRow
              label="Focus"
              goal={primary}
              flash={flashId === primary.id}
              lift={liftId === primary.id}
              onWrite={() => setLinkedId(primary.id)}
            />
          )}
          {nudge && (
            <FocusRow
              label="Remember"
              goal={nudge}
              flash={flashId === nudge.id}
              lift={liftId === nudge.id}
              onWrite={() => setLinkedId(nudge.id)}
            />
          )}
        </section>
      )}

      {recent.length > 0 && (
        <section className="today__recent">
          <h2>Recent</h2>
          <ul>
            {recent.map((e) => (
              <li key={e.id}>
                <span className={`kind kind--${e.kind}`}>{formatEntryKind(e.kind)}</span>
                <span>{e.rawText}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="today__all">
        <Link to="/app/goals">See all goals</Link>
      </p>

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function FocusRow({
  label,
  goal,
  flash,
  lift,
  onWrite,
}: {
  label: string
  goal: Goal
  flash: boolean
  lift: boolean
  onWrite: () => void
}) {
  return (
    <div className={`focus-row ${lift ? 'focus-row--lift' : ''}`}>
      <GoalRing goal={goal} flash={flash} size={40} />
      <div className="focus-row__text">
        <span className="focus-row__label">{label}</span>
        <Link to={`/app/goals/${goal.id}`} className="focus-row__title">
          {goal.title}
        </Link>
      </div>
      <button type="button" className="focus-row__write" onClick={onWrite}>
        Write
      </button>
    </div>
  )
}
