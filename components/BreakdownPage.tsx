'use client'

import { useState } from 'react'
import { Sentence } from '@/lib/types'
import Breakdown from './Breakdown'

type View = 'breakdown' | 'enter'

export default function BreakdownPage({ initial }: { initial: Sentence }) {
  const [view, setView] = useState<View>('breakdown')
  const [sentence, setSentence] = useState(initial)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (input.trim().length < 4) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: input.trim(), language: 'de' }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSentence(data)
      setView('breakdown')
      setInput('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <nav style={{ background: '#1B3A5C', padding: '0 48px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', height: 40 }}>
        {view === 'breakdown' ? (
          <button
            onClick={() => setView('enter')}
            style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 14px', cursor: 'pointer' }}
          >
            Enter a sentence
          </button>
        ) : (
          <button
            onClick={() => setView('breakdown')}
            style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ← Back
          </button>
        )}
      </nav>

      <main style={{ maxWidth: 860, padding: '40px 48px' }}>
        {view === 'breakdown' && <Breakdown sentence={sentence} />}

        {view === 'enter' && (
          <div style={{ maxWidth: 600 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1B3A5C', marginBottom: 8 }}>
              Type a sentence to break down.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 20 }}>
              Works best with complete sentences. Interesting grammar makes for a better breakdown.
            </p>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="e.g. Er hatte das Buch schon gelesen, bevor sie ankam."
              maxLength={300}
              style={{
                width: '100%', fontFamily: 'Georgia, serif', fontSize: '1.2rem',
                color: '#1B3A5C', background: 'white', border: '2px solid #D8D4CC',
                borderRadius: 8, padding: '16px 18px', lineHeight: 1.6,
                resize: 'none', minHeight: 100, outline: 'none',
              }}
            />
            <div style={{ fontSize: '0.72rem', color: '#BBB', textAlign: 'right', margin: '6px 0 16px' }}>
              {input.length} / 300
            </div>

            {error && (
              <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading || input.trim().length < 4}
              style={{
                background: loading || input.trim().length < 4 ? '#CCC' : '#1B3A5C',
                color: 'white', border: 'none', padding: '12px 28px',
                borderRadius: 6, fontSize: '0.9rem', fontWeight: 500,
                cursor: loading || input.trim().length < 4 ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Ms. Gramm is taking a look…' : 'Break it down'}
            </button>
          </div>
        )}
      </main>
    </>
  )
}
