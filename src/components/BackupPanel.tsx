import { useEffect, useRef, useState } from 'react'
import { exportBackup, exportMarkdown, parseBackupFile, restoreBackup } from '../db/backup'
import { getLastBackupAt } from '../db/operations'
import { ToastHost, useToasts } from './Toast'
import './BackupPanel.css'

interface BackupPanelProps {
  open: boolean
  onClose: () => void
}

function formatLastBackup(iso: string | null): string {
  if (!iso) return 'Never'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Never'
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function BackupPanel({ open, onClose }: BackupPanelProps) {
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, push, dismiss } = useToasts()

  useEffect(() => {
    if (!open) return
    setError(null)
    void getLastBackupAt().then(setLastBackupAtState)
  }, [open])

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

  async function onExportJson() {
    setBusy(true)
    setError(null)
    try {
      await exportBackup()
      setLastBackupAtState(await getLastBackupAt())
      push('Backup saved to your downloads')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export backup.')
    } finally {
      setBusy(false)
    }
  }

  async function onExportMarkdown() {
    setBusy(true)
    setError(null)
    try {
      await exportMarkdown()
      push('Markdown export saved to your downloads')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export Markdown.')
    } finally {
      setBusy(false)
    }
  }

  async function onFileChosen(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const backup = await parseBackupFile(file)
      const ok = window.confirm(
        'Restore this backup? It will replace all current Horizon data and cannot be undone.',
      )
      if (!ok) return
      await restoreBackup(backup)
      push('Backup restored — reloading…')
      window.setTimeout(() => {
        window.location.reload()
      }, 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore that file.')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="backup-panel" role="dialog" aria-modal="true" aria-labelledby="backup-panel-title">
      <div className="backup-panel__backdrop" onClick={onClose} />
      <div className="backup-panel__panel">
        <div className="backup-panel__panel-inner">
          <header className="backup-panel__header">
            <div>
              <p className="backup-panel__kicker">Data</p>
              <h2 id="backup-panel-title">Backup &amp; export</h2>
            </div>
            <button type="button" className="backup-panel__close" onClick={onClose} aria-label="Close">
              Esc
            </button>
          </header>

          <p className="backup-panel__lead">
            Horizon keeps everything in this browser. A backup file is the only way to recover after
            clearing site data, switching devices, or a browser mishap.
          </p>

          <div className="backup-panel__status">
            <p className="backup-panel__status-label">Last backup</p>
            <p className="backup-panel__status-value">{formatLastBackup(lastBackupAt)}</p>
          </div>

          <section className="backup-panel__section">
            <h3 className="backup-panel__section-title">Export backup (JSON)</h3>
            <p className="backup-panel__section-blurb">
              A full snapshot you can restore later into Horizon. Prefer this for safety.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy}
              onClick={() => void onExportJson()}
            >
              Download JSON backup
            </button>
          </section>

          <section className="backup-panel__section">
            <h3 className="backup-panel__section-title">Export as Markdown</h3>
            <p className="backup-panel__section-blurb">
              A readable copy of your goals and journal, for reading elsewhere or moving off Horizon.
              Can&apos;t be re-imported.
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={() => void onExportMarkdown()}
            >
              Download Markdown
            </button>
          </section>

          <section className="backup-panel__section">
            <h3 className="backup-panel__section-title">Restore from file</h3>
            <p className="backup-panel__section-blurb">
              Replace everything currently in this browser with a Horizon JSON backup. This cannot be
              undone.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="backup-panel__file"
              onChange={(e) => void onFileChosen(e.target.files?.[0])}
            />
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose backup file…
            </button>
          </section>

          {error && (
            <p className="backup-panel__error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
