import { useEffect, useState } from 'react'
import type { Goal } from '../db/schema'
import { xpProgress } from '../lib/xp'
import { momentumRatio } from '../lib/priority'
import './GoalRing.css'

interface GoalRingProps {
  goal: Goal
  size?: number
  flash?: boolean
  showLabel?: boolean
}

export function GoalRing({ goal, size = 44, flash = false, showLabel = true }: GoalRingProps) {
  const { ratio, level } = xpProgress(goal.xp)
  const momentum = momentumRatio(goal.lastTouchedAt)
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const [displayRatio, setDisplayRatio] = useState(ratio)

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplayRatio(ratio))
    return () => cancelAnimationFrame(id)
  }, [ratio])

  return (
    <div className={`goal-ring ${flash ? 'goal-ring--flash' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="goal-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={3}
          fill="none"
        />
        <circle
          className="goal-ring__momentum"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={3}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - momentum)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle
          className="goal-ring__xp"
          cx={size / 2}
          cy={size / 2}
          r={r - 4}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={2 * Math.PI * (r - 4)}
          strokeDashoffset={2 * Math.PI * (r - 4) * (1 - displayRatio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && <span className="goal-ring__level">{level}</span>}
    </div>
  )
}
