'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/authFetch'

interface Props {
  userId: string
  email: string
  onClose: () => void
}

export default function RequestAccessModal({ userId, email, onClose }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function request() {
    setStatus('loading')
    try {
      const res = await authFetch('/api/request-access', {
        method: 'POST',
        body: JSON.stringify({ userId, email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{
        background: 'var(--bone)', padding: '36px 40px',
        width: 420, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        {status === 'done' ? (
          <>
            <p style={headingStyle}>Request received.</p>
            <p style={bodyStyle}>
              We'll review your request and be in touch at {email}.
            </p>
            <button onClick={onClose} style={btnPrimary}>Close</button>
          </>
        ) : (
          <>
            <p style={headingStyle}>Sentence submission requires access.</p>
            <p style={bodyStyle}>
              During the pilot, submission is by invitation. Send a request and we'll be in touch.
            </p>
            {status === 'error' && (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#8B3A3A', marginBottom: 16 }}>
                Something went wrong. Please try again.
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
              <button
                onClick={request}
                disabled={status === 'loading'}
                style={{ ...btnPrimary, opacity: status === 'loading' ? 0.6 : 1, cursor: status === 'loading' ? 'default' : 'pointer' }}
              >
                {status === 'loading' ? 'Sending…' : 'Request access'}
              </button>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--display)',
  fontWeight: 400,
  fontSize: 18,
  letterSpacing: '-0.01em',
  color: 'var(--ink)',
  marginBottom: 12,
}

const bodyStyle: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink-60)',
  lineHeight: 1.6,
  marginBottom: 0,
}

const btnPrimary: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'var(--ink)',
  color: 'var(--bone)',
  border: 0,
  padding: '11px 24px',
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--ink-40)',
  border: 0,
  padding: '11px 0',
  cursor: 'pointer',
}
