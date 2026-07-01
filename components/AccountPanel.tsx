'use client'

import { useState, useEffect, useRef } from 'react'
import { authFetch } from '@/lib/authFetch'

interface AccountData {
  licenseType: string | null
  role: string
  expiresAt: string | null
  periodEnd: string
  tokensUsed: number
  limit: number
  isAdmin: boolean
}

interface Props {
  email: string
  onSignOut: () => void
}

export default function AccountPanel({ email, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<AccountData | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || data) return
    authFetch('/api/account').then(r => r.json()).then(setData).catch(() => {})
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const pct = data && data.limit > 0 ? Math.min(100, Math.round((data.tokensUsed / data.limit) * 100)) : 0

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-60)',
          background: 'transparent', border: 0, cursor: 'pointer',
          padding: 0,
        }}
      >
        Account
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          background: 'var(--bone)', border: 'var(--border-hair)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          width: 280, padding: '20px 24px', zIndex: 500,
        }}>
          {/* Email */}
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-40)', marginBottom: 4 }}>
            Signed in as
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', marginBottom: 20, wordBreak: 'break-all' }}>
            {email}
          </p>

          {data ? (
            data.isAdmin ? (
              <p style={metaStyle}>Admin — unlimited access</p>
            ) : data.licenseType ? (
              <>
                {/* Access expiry */}
                {data.expiresAt && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={labelStyle}>Pilot access until</p>
                    <p style={metaStyle}>{formatDate(data.expiresAt)}</p>
                  </div>
                )}

                {/* Token usage bar */}
                {data.limit > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={labelStyle}>Usage this period</p>
                      <p style={labelStyle}>{pct}%</p>
                    </div>
                    <div style={{ height: 4, background: 'var(--ink-20)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${pct}%`,
                        background: pct > 80 ? '#8B3A3A' : 'var(--ink)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <p style={{ ...labelStyle, marginTop: 6, color: 'var(--ink-40)' }}>
                      Resets {formatDate(data.periodEnd)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p style={metaStyle}>No active subscription</p>
            )
          ) : (
            <p style={labelStyle}>Loading…</p>
          )}

          <div style={{ borderTop: 'var(--border-rule)', marginTop: 20, paddingTop: 16 }}>
            <button
              onClick={() => { setOpen(false); onSignOut() }}
              style={{
                fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--ink-40)',
                background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ink-40)', margin: 0,
}

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', margin: 0,
}
