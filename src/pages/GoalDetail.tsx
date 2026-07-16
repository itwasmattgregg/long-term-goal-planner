import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Composer } from '../components/Composer'
import { GoalRing } from '../components/GoalRing'
import { ToastHost, useToasts } from '../components/Toast'
import {
  addMilestone,
  completeMilestone,
  deleteEntry,
  deleteMilestone,
  getEntriesForGoal,
  getGoal,
  getMilestonesForGoal,
  uncompleteMilestone,
  updateGoal,
  type SaveEntryResult,
} from '../db/operations'
import { xpProgress } from '../lib/xp'
import { formatEntryKind } from '../lib/entryKinds'
import type { Entry, Goal, Milestone } from '../db/schema'
import './GoalDetail.css'

export function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const { toasts, push, dismiss } = useToasts()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [flash, setFlash] = useState(false)
  const [lift, setLift] = useState(false)

  const refresh = useCallback(async () => {
    if (!id) return
    const g = (await getGoal(id)) ?? null
    setGoal(g)
    if (!g) return
    setEntries(await getEntriesForGoal(id))
    setMilestones(await getMilestonesForGoal(id))
  }, [id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function togglePin() {
    if (!goal) return
    const updated = await updateGoal(goal.id, { pinned: !goal.pinned })
    if (updated) setGoal(updated)
  }

  async function setStatus(status: Goal['status']) {
    if (!goal) return
    const updated = await updateGoal(goal.id, { status })
    if (updated) setGoal(updated)
  }

  async function onAddMilestone(e: FormEvent) {
    e.preventDefault()
    if (!goal || !milestoneTitle.trim()) return
    await addMilestone(goal.id, milestoneTitle)
    setMilestoneTitle('')
    await refresh()
  }

  function celebrate(result: { goal: Goal; leveledUp: boolean }, fallback: string) {
    setGoal(result.goal)
    setFlash(true)
    window.setTimeout(() => setFlash(false), 800)
    if (result.leveledUp) {
      setLift(true)
      push(`${result.goal.title} reached level ${result.goal.level}`, 'levelup')
      window.setTimeout(() => setLift(false), 900)
    } else {
      push(fallback)
    }
  }

  async function onToggleMilestone(mid: string, currentlyDone: boolean) {
    if (currentlyDone) {
      const result = await uncompleteMilestone(mid)
      if (!result) return
      setGoal(result.goal)
      await refresh()
      return
    }
    const result = await completeMilestone(mid)
    if (!result) return
    celebrate(result, 'Milestone complete · +XP')
    await refresh()
  }

  async function onDeleteMilestone(mid: string) {
    const updated = await deleteMilestone(mid)
    if (updated) setGoal(updated)
    await refresh()
  }

  async function onDeleteEntry(entryId: string) {
    const updated = await deleteEntry(entryId)
    if (updated) setGoal(updated)
    await refresh()
  }

  async function onSaved(result: SaveEntryResult) {
    celebrate(result, 'Logged · +XP')
    await refresh()
  }

  if (!goal) {
    return (
      <div className="detail">
        <p>Goal not found.</p>
        <Link to="/app/goals">Back</Link>
      </div>
    )
  }

  const progress = xpProgress(goal.xp)

  return (
    <div className="detail">
      <Link to="/app/goals" className="detail__back">
        ← Goals
      </Link>

      <header className={`detail__header ${lift ? 'detail__header--lift' : ''}`}>
        <GoalRing goal={goal} size={64} flash={flash} />
        <div>
          <h1>{goal.title}</h1>
          <p className="detail__xp">
            Level {goal.level} · {progress.into}/{progress.need} XP
          </p>
        </div>
      </header>

      <div className="detail__controls">
        <button type="button" className="btn btn--ghost" onClick={() => void togglePin()}>
          {goal.pinned ? 'Unpin' : 'Pin'}
        </button>
        {goal.status === 'active' && (
          <button type="button" className="btn btn--ghost" onClick={() => void setStatus('paused')}>
            Pause
          </button>
        )}
        {goal.status === 'paused' && (
          <button type="button" className="btn btn--ghost" onClick={() => void setStatus('active')}>
            Resume
          </button>
        )}
        {goal.status !== 'done' && (
          <button type="button" className="btn btn--ghost" onClick={() => void setStatus('done')}>
            Mark done
          </button>
        )}
        {goal.status === 'done' && (
          <button type="button" className="btn btn--ghost" onClick={() => void setStatus('active')}>
            Reopen
          </button>
        )}
      </div>

      <section className="detail__milestones">
        <h2>Milestones</h2>
        <ul>
          {milestones.map((m) => (
            <li key={m.id} className={m.status === 'done' ? 'is-done' : undefined}>
              <label>
                <input
                  type="checkbox"
                  checked={m.status === 'done'}
                  onChange={() => void onToggleMilestone(m.id, m.status === 'done')}
                />
                <span>{m.title}</span>
              </label>
              <button
                type="button"
                className="item-delete"
                aria-label={`Delete milestone ${m.title}`}
                onClick={() => void onDeleteMilestone(m.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <form className="detail__add-ms" onSubmit={(e) => void onAddMilestone(e)}>
          <input
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            placeholder="Add a milestone"
          />
          <button type="submit" className="btn btn--primary" disabled={!milestoneTitle.trim()}>
            Add
          </button>
        </form>
      </section>

      <section className="detail__compose">
        <h2>Journal</h2>
        <Composer
          placeholder={`A note about ${goal.title}…`}
          prelinkedGoalId={goal.id}
          onSaved={(result) => void onSaved(result)}
        />
      </section>

      <section className="detail__timeline">
        {entries.length === 0 ? (
          <p className="detail__empty">No entries yet.</p>
        ) : (
          <ol>
            {entries.map((e) => (
              <li key={e.id} className={`timeline-item timeline-item--${e.kind}`}>
                <span className="timeline-item__mark" aria-hidden />
                <div className="timeline-item__body">
                  <div className="timeline-item__meta">
                    <span className="timeline-item__kind">{formatEntryKind(e.kind)}</span>
                    <time dateTime={e.createdAt}>
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  <p>{e.rawText}</p>
                </div>
                <button
                  type="button"
                  className="item-delete"
                  aria-label="Delete journal entry"
                  onClick={() => void onDeleteEntry(e.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
