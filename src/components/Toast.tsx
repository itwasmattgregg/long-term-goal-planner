import { useEffect, useState } from 'react'
import './Toast.css'

export interface ToastMessage {
  id: string
  text: string
  kind?: 'levelup' | 'info'
}

interface ToastHostProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leave = window.setTimeout(() => setLeaving(true), 2400)
    const gone = window.setTimeout(() => onDismiss(toast.id), 2800)
    return () => {
      window.clearTimeout(leave)
      window.clearTimeout(gone)
    }
  }, [toast.id, onDismiss])

  return (
    <div className={`toast ${toast.kind === 'levelup' ? 'toast--levelup' : ''} ${leaving ? 'toast--out' : ''}`}>
      {toast.text}
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  function push(text: string, kind: ToastMessage['kind'] = 'info') {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), text, kind }])
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, push, dismiss }
}
