'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

let listeners: ((toast: ToastItem) => void)[] = []

export function toast(message: string, type: ToastType = 'info') {
  const item: ToastItem = { id: Date.now().toString(), type, message }
  listeners.forEach((l) => l(item))
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (item: ToastItem) => {
      setToasts((prev) => [...prev, item])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id))
      }, 4000)
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((l) => l !== handler)
    }
  }, [])

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="toaster">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <Icon size={18} />
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="toast__close">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
