import React, { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}

interface NotificationContextType {
  toasts: Toast[]
  notify: (message: string, type?: ToastType) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

let nextId = 0

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <NotificationContext.Provider value={{ toasts, notify }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}
