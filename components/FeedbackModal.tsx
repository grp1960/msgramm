'use client'

import { useState } from 'react'

export type FeedbackScope = 'general' | 'sentence' | 'topic' | 'word'

const TYPES = ['Wrong analysis', 'Confusing', 'Suggestion', 'Other'] as const
type FeedbackType = typeof TYPES[number]

interface Props {
  scope: FeedbackScope
  sentenceId?: string
  itemId?: string
  userId?: string
  userEmail?: string
  onClose: () => void
}

export default function FeedbackModal({ scope, sentenceId, itemId, userId, userEmail, onClose }: Props) {
  const [type, setType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [mayFollowUp, setMayFollowUp] = useState(false)
  const [email, setEmail] = useState(userEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!message.trim()) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          itemId: itemId ?? sentenceId ?? null,
          sentenceId: sentenceId ?? null,
          type: type ?? null,
          message: message.trim(),
          userId: userId ?? null,
          email: mayFollowUp ? email.trim() || null : null,
          mayFollowUp,
        }),
      })
      setDone(true)
    } catch {
      // silent — best effort
    } finally {
      setLoading(false)
    }
  }

  const placeholder = scope === 'sentence'
    ? 'Something wrong with this analysis? A suggestion? Anything helps.'
    : 'What\'s on your mind?'

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
        background: 'white', borderRadius: 10, padding: '32px 36px',
        width: 440, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>✓</div>
            <p style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1rem', marginBottom: 8 }}>
              Thanks for the feedback.
            </p>
            {mayFollowUp && (
              <p style={{ fontSize: '0.8rem', color: '#999' }}>We may be in touch.</p>
            )}
            <button onClick={onClose} style={btnPrimary}>Close</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1.05rem', marginBottom: 20, fontWeight: 600 }}>
              {scope === 'sentence' ? 'Feedback on this sentence' : 'Feedback'}
            </h2>

            {/* Type chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(type === t ? null : t)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem',
                    fontWeight: 500, cursor: 'pointer',
                    background: type === t ? '#1B3A5C' : 'white',
                    color: type === t ? 'white' : '#666',
                    border: `1px solid ${type === t ? '#1B3A5C' : '#D8D4CC'}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={placeholder}
              maxLength={1000}
              style={{
                width: '100%', minHeight: 100, padding: '12px 14px',
                border: '1px solid #D8D4CC', borderRadius: 6,
                fontSize: '0.88rem', lineHeight: 1.55, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />

            {/* May follow up */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 0', cursor: 'pointer', fontSize: '0.82rem', color: '#555' }}>
              <input
                type="checkbox"
                checked={mayFollowUp}
                onChange={e => setMayFollowUp(e.target.checked)}
                style={{ accentColor: '#1B3A5C' }}
              />
              May we follow up with you?
            </label>

            {mayFollowUp && (
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                style={{
                  marginTop: 10, width: '100%', padding: '9px 12px',
                  border: '1px solid #D8D4CC', borderRadius: 6,
                  fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
              <button
                onClick={submit}
                disabled={loading || !message.trim()}
                style={{ ...btnPrimary, opacity: loading || !message.trim() ? 0.5 : 1, cursor: loading || !message.trim() ? 'default' : 'pointer' }}
              >
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  background: '#1B3A5C', color: 'white', border: 'none',
  padding: '9px 22px', borderRadius: 6, fontSize: '0.85rem',
  fontWeight: 500, cursor: 'pointer', marginTop: 16,
}

const btnSecondary: React.CSSProperties = {
  background: 'white', color: '#666', border: '1px solid #D8D4CC',
  padding: '9px 22px', borderRadius: 6, fontSize: '0.85rem',
  fontWeight: 500, cursor: 'pointer',
}
