'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/authFetch'

type Props = {
  userId: string
  onActivated: () => void
}

export default function InviteGate({ userId, onActivated }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function redeem() {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/invite/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        onActivated()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bone)',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{ maxWidth: 420, width: '100%', padding: '0 24px' }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: 16,
        }}>
          Ms▪Gramm
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Enter your invite code
        </h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 32, lineHeight: 1.5 }}>
          Ms. Gramm is currently invite-only. Enter the code you received to activate your pilot access.
        </p>

        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(null) }}
          onKeyDown={e => e.key === 'Enter' && redeem()}
          placeholder="MSGRAMM-PILOT"
          style={{
            width: '100%',
            padding: '12px 14px',
            fontFamily: 'var(--mono)',
            fontSize: 15,
            letterSpacing: '0.08em',
            border: error ? '1.5px solid #c0392b' : '1.5px solid var(--ink)',
            background: 'white',
            color: 'var(--ink)',
            outline: 'none',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        {error && (
          <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={redeem}
          disabled={loading || !code.trim()}
          style={{
            width: '100%',
            padding: '12px 0',
            background: 'var(--ink)',
            color: 'white',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !code.trim() ? 0.5 : 1,
          }}
        >
          {loading ? 'Activating…' : 'Activate'}
        </button>
      </div>
    </div>
  )
}
