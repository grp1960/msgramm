'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

type Toast = {
  id: number
  message: string
  duration?: number
}

type ToastContextValue = {
  show: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((message: string, duration = 4000) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, duration }])
    if (duration > 0) setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div style={{
      pointerEvents: 'all',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'var(--ink)',
      color: 'var(--bone)',
      padding: '10px 14px 10px 16px',
      borderRadius: 4,
      fontFamily: 'var(--sans)',
      fontSize: 13,
      lineHeight: 1.4,
      maxWidth: 300,
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      animation: 'toast-in 0.2s ease',
    }}>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 0,
          color: 'var(--bone)',
          opacity: 0.5,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >×</button>
    </div>
  )
}
