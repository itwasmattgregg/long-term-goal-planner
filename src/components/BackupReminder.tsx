import { useCallback, useEffect, useState } from 'react'
import { exportBackup } from '../db/backup'
import {
  BACKUP_CHANGED_EVENT,
  getBackupReminderSnoozedUntil,
  getLastBackupAt,
  goalCount,
  setBackupReminderSnoozedUntil,
} from '../db/operations'
import './BackupReminder.css'

const REMIND_AFTER_DAYS = 14
const SNOOZE_DAYS = 7

function daysSince(iso: string): number {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
}

export function BackupReminder() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const count = await goalCount()
    if (count === 0) {
      setVisible(false)
      return
    }

    const snoozedUntil = await getBackupReminderSnoozedUntil()
    if (snoozedUntil) {
      const until = new Date(snoozedUntil).getTime()
      if (!Number.isNaN(until) && until > Date.now()) {
        setVisible(false)
        return
      }
    }

    const last = await getLastBackupAt()
    if (!last || daysSince(last) >= REMIND_AFTER_DAYS) {
      setVisible(true)
      return
    }

    setVisible(false)
  }, [])

  useEffect(() => {
    void refresh()
    function onBackupChanged() {
      void refresh()
    }
    window.addEventListener(BACKUP_CHANGED_EVENT, onBackupChanged)
    return () => window.removeEventListener(BACKUP_CHANGED_EVENT, onBackupChanged)
  }, [refresh])

  if (!visible) return null

  async function onBackupNow() {
    setBusy(true)
    try {
      await exportBackup()
      setVisible(false)
    } finally {
      setBusy(false)
    }
  }

  async function onSnooze() {
    const until = new Date()
    until.setDate(until.getDate() + SNOOZE_DAYS)
    await setBackupReminderSnoozedUntil(until.toISOString())
    setVisible(false)
  }

  return (
    <aside className="backup-reminder" role="status">
      <p className="backup-reminder__text">
        Your data lives only in this browser. Back it up so a clear or crash doesn&apos;t take your
        journal with it.
      </p>
      <div className="backup-reminder__actions">
        <button
          type="button"
          className="btn btn--primary backup-reminder__btn"
          disabled={busy}
          onClick={() => void onBackupNow()}
        >
          Back up now
        </button>
        <button
          type="button"
          className="btn btn--ghost backup-reminder__btn"
          disabled={busy}
          onClick={() => void onSnooze()}
        >
          Remind me later
        </button>
      </div>
    </aside>
  )
}
