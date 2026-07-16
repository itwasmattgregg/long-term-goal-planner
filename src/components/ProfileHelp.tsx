import { useEffect, useState } from 'react'
import { setLevelSystemPreference } from '../db/operations'
import {
  LEVEL_SYSTEMS,
  buildLadder,
  getLevelSystem,
  titleForLevel,
  type LevelSystemId,
} from '../lib/levelSystems'
import './ProfileHelp.css'

interface ProfileHelpProps {
  open: boolean
  onClose: () => void
  xp: number
  level: number
  into: number
  need: number
  systemId: LevelSystemId
  onSystemChange: (id: LevelSystemId) => void
}

export function ProfileHelp({
  open,
  onClose,
  xp,
  level,
  into,
  need,
  systemId,
  onSystemChange,
}: ProfileHelpProps) {
  const [previewId, setPreviewId] = useState<LevelSystemId>(systemId)

  useEffect(() => {
    if (open) setPreviewId(systemId)
  }, [open, systemId])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const activeSystem = getLevelSystem(systemId)
  const preview = getLevelSystem(previewId)
  const ladder = buildLadder(preview)
  const remaining = Math.max(0, need - into)
  const nextThreshold = xp + remaining

  async function selectSystem(id: LevelSystemId) {
    setPreviewId(id)
    await setLevelSystemPreference(id)
    onSystemChange(id)
  }

  return (
    <div className="profile-help" role="dialog" aria-modal="true" aria-labelledby="profile-help-title">
      <div className="profile-help__backdrop" onClick={onClose} />
      <div className="profile-help__panel">
        <div className="profile-help__panel-inner">
          <header className="profile-help__header">
            <div>
              <p className="profile-help__kicker">Profile</p>
              <h2 id="profile-help-title">Your climb</h2>
            </div>
            <button type="button" className="profile-help__close" onClick={onClose} aria-label="Close">
              Esc
            </button>
          </header>

          <p className="profile-help__lead">
            Every goal feeds one shared pool of XP — even goals you&apos;ve retired.
            Pick a flavor for the ladder. The XP stays the same; the story changes.
          </p>

          <div className="profile-help__status">
            <p className="profile-help__status-xp">
              <strong>{xp}</strong> XP total
            </p>
            <p className="profile-help__status-rank">
              You are <em>{titleForLevel(activeSystem, level)}</em>
              {remaining > 0 && (
                <>
                  {' '}
                  · <span>{remaining} XP</span> to the next rung ({nextThreshold} XP)
                </>
              )}
            </p>
          </div>

          <div className="profile-help__systems" role="tablist" aria-label="Level systems">
            {LEVEL_SYSTEMS.map((system) => {
              const active = previewId === system.id
              const selected = systemId === system.id
              return (
                <button
                  key={system.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`profile-help__system ${active ? 'is-active' : ''} ${selected ? 'is-selected' : ''}`}
                  onClick={() => void selectSystem(system.id)}
                >
                  <span className="profile-help__system-name">{system.name}</span>
                  <span className="profile-help__system-tag">{system.tagline}</span>
                </button>
              )
            })}
          </div>

          <div className="profile-help__flavor">
            <h3 className="profile-help__flavor-name">{preview.name}</h3>
            <p className="profile-help__flavor-blurb">{preview.blurb}</p>
          </div>

          <ol className="profile-help__ladder">
            {ladder.map((rung) => {
              const reached = xp >= rung.xpRequired
              const current = rung.level === level
              return (
                <li
                  key={rung.level}
                  className={`profile-help__rung ${reached ? 'is-reached' : ''} ${current ? 'is-current' : ''}`}
                >
                  <span className="profile-help__rung-level">{rung.level}</span>
                  <span className="profile-help__rung-title">
                    {rung.title}
                    {current && <span className="profile-help__you">you</span>}
                  </span>
                  <span className="profile-help__rung-xp">{rung.xpRequired} XP</span>
                </li>
              )
            })}
          </ol>

          <p className="profile-help__foot">
            Past rung 11, each new level asks for <strong>500 XP</strong> more.
            The titles keep getting weirder. That&apos;s intentional.
          </p>
        </div>
      </div>
    </div>
  )
}
