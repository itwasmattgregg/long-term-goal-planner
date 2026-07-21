import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  getLevelSystemPreference,
  getProfileProgress,
  LEVEL_SYSTEM_CHANGED_EVENT,
  PROFILE_CHANGED_EVENT,
} from '../db/operations'
import { badgeText, getLevelSystem, type LevelSystemId } from '../lib/levelSystems'
import { BackupPanel } from './BackupPanel'
import { BackupReminder } from './BackupReminder'
import { ProfileHelp } from './ProfileHelp'
import './AppShell.css'

export function AppShell() {
  const [profile, setProfile] = useState<{ level: number; into: number; need: number; xp: number } | null>(
    null,
  )
  const [systemId, setSystemId] = useState<LevelSystemId>('classic')
  const [helpOpen, setHelpOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)

  useEffect(() => {
    async function refreshProfile() {
      setProfile(await getProfileProgress())
    }
    async function refreshSystem() {
      setSystemId(await getLevelSystemPreference())
    }
    void refreshProfile()
    void refreshSystem()
    window.addEventListener(PROFILE_CHANGED_EVENT, refreshProfile)
    window.addEventListener(LEVEL_SYSTEM_CHANGED_EVENT, refreshSystem)
    return () => {
      window.removeEventListener(PROFILE_CHANGED_EVENT, refreshProfile)
      window.removeEventListener(LEVEL_SYSTEM_CHANGED_EVENT, refreshSystem)
    }
  }, [])

  const system = getLevelSystem(systemId)
  const badge = profile ? badgeText(system, profile.level) : null

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand-row">
          <NavLink to="/app" className="shell__brand">
            Horizon
          </NavLink>
          {profile && profile.xp > 0 && badge && (
            <button
              type="button"
              className={`shell__profile shell__profile--${systemId}`}
              title={`${profile.xp} XP total · open level guide`}
              aria-label={`Profile level: ${badge.value}. Open level guide.`}
              onClick={() => setHelpOpen(true)}
            >
              <span className="shell__profile-label">{badge.label}</span>
              <span className="shell__profile-level">{badge.value}</span>
            </button>
          )}
        </div>
        <div className="shell__header-end">
          <button
            type="button"
            className="shell__backup"
            title="Backup and export"
            aria-label="Open backup and export"
            onClick={() => setBackupOpen(true)}
          >
            Backup
          </button>
          <nav className="shell__nav" aria-label="App">
            <NavLink to="/app" end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              Today
            </NavLink>
            <NavLink to="/app/goals" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              Goals
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="shell__main">
        <BackupReminder />
        <Outlet />
      </main>

      {profile && (
        <ProfileHelp
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          xp={profile.xp}
          level={profile.level}
          into={profile.into}
          need={profile.need}
          systemId={systemId}
          onSystemChange={setSystemId}
        />
      )}

      <BackupPanel open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  )
}
