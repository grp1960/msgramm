'use client'

import { useState, useEffect } from 'react'
import { Sentence } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Breakdown from './Breakdown'
import AuthModal from './AuthModal'

type View = 'breakdown' | 'enter' | 'saved'

export default function BreakdownPage({ initial }: { initial: Sentence }) {
  const [view, setView] = useState<View>('breakdown')
  const [sentence, setSentence] = useState(initial)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedList, setSavedList] = useState<Sentence[]>([])
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadSavedCount()
  }, [user])

  async function loadSavedCount() {
    const { count } = await supabase
      .from('saved_sentences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
    setSavedCount(count ?? 0)
  }

  async function loadSavedList() {
    const { data } = await supabase
      .from('saved_sentences')
      .select('sentence_id, sentences(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) setSavedList(data.map((r: any) => r.sentences))
  }

  async function saveSentence() {
    if (!user) { setShowAuth(true); return }
    const { error } = await supabase
      .from('saved_sentences')
      .insert({ user_id: user.id, sentence_id: sentence.id })
    if (!error) {
      setSaved(true)
      setSavedCount(c => c + 1)
    }
  }

  async function submit() {
    if (input.trim().length < 4) return
    setLoading(true)
    setError(null)
    setSaved(false)
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

  function showSaved() {
    loadSavedList()
    setView('saved')
  }

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Nav bar */}
      <nav style={{
        background: '#16324F', padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 12, height: 40,
      }}>
        {view !== 'breakdown' && (
          <button onClick={() => setView('breakdown')} style={navBtn}>
            ← Back
          </button>
        )}
        {view === 'breakdown' && (
          <button onClick={() => setView('enter')} style={navBtn}>
            Enter a sentence
          </button>
        )}
        {user && savedCount > 0 && view !== 'saved' && (
          <button onClick={showSaved} style={navBtn}>
            My sentences ({savedCount})
          </button>
        )}
        {user ? (
          <button onClick={() => supabase.auth.signOut()} style={navBtn}>
            Sign out
          </button>
        ) : (
          <button onClick={() => setShowAuth(true)} style={{ ...navBtn, borderColor: 'rgba(255,255,255,0.6)', color: 'white' }}>
            Sign in
          </button>
        )}
      </nav>

      <main style={{ maxWidth: 860, padding: '40px 48px' }}>

        {/* Breakdown view */}
        {view === 'breakdown' && (
          <Breakdown
            sentence={sentence}
            saved={saved}
            onSave={saveSentence}
            saveLabel={user ? 'Save' : 'Sign in to save'}
          />
        )}

        {/* Enter sentence view */}
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
            {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}
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

        {/* Saved sentences view */}
        {view === 'saved' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1.2rem', marginBottom: 24 }}>
              My Sentences
            </h2>
            {savedList.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>No saved sentences yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSentence(s); setSaved(true); setView('breakdown') }}
                    style={{
                      textAlign: 'left', padding: '14px 18px', borderRadius: 8,
                      border: '1px solid #E8E4DC', background: 'white', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1rem', marginBottom: 4 }}>
                      {s.text}
                    </div>
                    {s.breakdown?.translation && (
                      <div style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
                        {s.breakdown.translation}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </>
  )
}

const navBtn: React.CSSProperties = {
  fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
  padding: '4px 14px', cursor: 'pointer',
}
