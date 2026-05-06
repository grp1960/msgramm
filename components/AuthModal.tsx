'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!email.includes('@')) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 32, width: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1.2rem', marginBottom: 8 }}>
          Sign in to Ms. Gramm
        </h2>

        {!sent ? (
          <>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 20, lineHeight: 1.5 }}>
              Enter your email and we'll send you a sign-in link. No password needed.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="your@email.com"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 6,
                border: '2px solid #D8D4CC', fontSize: '1rem', outline: 'none',
                marginBottom: 12,
              }}
            />
            {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
            <button
              onClick={send}
              disabled={loading || !email.includes('@')}
              style={{
                width: '100%', padding: '10px', borderRadius: 6, border: 'none',
                background: loading || !email.includes('@') ? '#CCC' : '#1B3A5C',
                color: 'white', fontSize: '0.9rem', fontWeight: 500,
                cursor: loading || !email.includes('@') ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✉️</div>
            <p style={{ color: '#1B3A5C', fontWeight: 500, marginBottom: 6 }}>Check your email</p>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              We sent a sign-in link to <strong>{email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
