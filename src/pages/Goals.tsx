import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GoalRing } from '../components/GoalRing'
import { deleteGoal, getAllGoals } from '../db/operations'
import type { Goal } from '../db/schema'
import './Goals.css'

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])

  const refresh = useCallback(async () => {
    setGoals(await getAllGoals())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onDelete(id: string) {
    await deleteGoal(id)
    await refresh()
  }

  const active = goals.filter((g) => g.status === 'active')
  const other = goals.filter((g) => g.status !== 'active')

  return (
    <div className="goals">
      <h1>Goals</h1>
      {goals.length === 0 ? (
        <p className="goals__empty">
          Nothing here yet. <Link to="/app">Write a sentence</Link> to begin.
        </p>
      ) : (
        <>
          <GoalList items={active} onDelete={onDelete} />
          {other.length > 0 && (
            <>
              <h2 className="goals__sub">Paused & done</h2>
              <GoalList items={other} muted onDelete={onDelete} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function GoalList({
  items,
  muted,
  onDelete,
}: {
  items: Goal[]
  muted?: boolean
  onDelete: (id: string) => void | Promise<void>
}) {
  return (
    <ul className={`goals__list ${muted ? 'goals__list--muted' : ''}`}>
      {items.map((g) => (
        <li key={g.id} className="goals__row">
          <Link to={`/app/goals/${g.id}`} className="goals__item">
            <GoalRing goal={g} size={42} />
            <div className="goals__meta">
              <span className="goals__title">
                {g.pinned && <span className="goals__pin" aria-label="Pinned">◈</span>}
                {g.title}
              </span>
              <span className="goals__level">Level {g.level}</span>
            </div>
          </Link>
          <button
            type="button"
            className="item-delete"
            aria-label={`Delete ${g.title}`}
            onClick={(e) => {
              e.preventDefault()
              void onDelete(g.id)
            }}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
