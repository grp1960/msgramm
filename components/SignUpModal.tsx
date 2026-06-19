'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  border: '1.5px solid #CCCCCC',
  outline: 'none',
  background: 'white',
  color: 'var(--ink)',
  boxSizing: 'border-box',
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: 12,
}

export default function SignUpModal({ onClose, onSwitchToSignIn }: {
  onClose: () => void
  onSwitchToSignIn: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')
  const [sent, setSent]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function validate() {
    if (!firstName.trim()) return 'First name is required.'
    if (!lastName.trim())  return 'Last name is required.'
    if (!username.trim())  return 'Username is required.'
    if (!/^[a-z0-9_-]{3,30}$/i.test(username.trim())) return 'Username: 3–30 characters, letters, numbers, _ or - only.'
    if (!email.includes('@')) return 'Please enter a valid email address.'
    return null
  }

  async function send() {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError(null)

    // Stash profile data in localStorage — saved to DB after magic link confirm
    localStorage.setItem('mg_pending_profile', JSON.stringify({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim().toLowerCase(),
      display_name: `${firstName.trim()} ${lastName.trim()}`,
    }))

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bone)', padding: '36px 32px', width: 400,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: 14 }}>
          MS▪GRAMM
        </div>

        {!sent ? (
          <>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
              Create your account
            </h2>
            <p style={{ fontSize: 13, color: '#777', marginBottom: 24, lineHeight: 1.5 }}>
              Already have an account?{' '}
              <button onClick={onSwitchToSignIn} style={{ background: 'none', border: 0, padding: 0, color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}>
                Sign in
              </button>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={ROW_STYLE}>
                <input
                  style={INPUT_STYLE}
                  placeholder="First name"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); setError(null) }}
                  autoFocus
                />
                <input
                  style={INPUT_STYLE}
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => { setLastName(e.target.value); setError(null) }}
                />
              </div>

              <input
                style={INPUT_STYLE}
                placeholder="Username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(null) }}
                autoComplete="username"
                spellCheck={false}
              />

              <input
                style={INPUT_STYLE}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && send()}
                autoComplete="email"
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#c0392b', marginTop: 10 }}>{error}</p>
            )}

            <button
              onClick={send}
              disabled={loading}
              style={{
                width: '100%', marginTop: 20,
                padding: '11px 0',
                background: loading ? '#999' : 'var(--ink)',
                color: 'white',
                fontFamily: 'var(--mono)',
                fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>

            <p style={{ fontSize: 11, color: '#999', marginTop: 14, lineHeight: 1.5 }}>
              We'll email you a magic link — no password needed.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 32, marginBottom: 16 }}>✉</div>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Check your email</p>
            <p style={{ fontSize: 13, color: '#777', lineHeight: 1.5 }}>
              We sent a sign-in link to <strong>{email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
