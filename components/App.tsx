'use client'

import { useState, useEffect } from 'react'
import { Sentence, Difficulty } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Breakdown from './Breakdown'
import AuthModal from './AuthModal'

const DIFFICULTY_ORDER: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; color: string }> = {
  Beginner:     { bg: '#E8F5E9', color: '#2E7D32' },
  Intermediate: { bg: '#E3F2FD', color: '#1565C0' },
  Advanced:     { bg: '#FFF3E0', color: '#E65100' },
  Expert:       { bg: '#FCE4EC', color: '#880E4F' },
}

type View = 'list' | 'breakdown' | 'enter'
type ListFilter = 'all' | 'mine'

export default function App() {
  const [view, setView] = useState<View>('list')
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [sentence, setSentence] = useState<Sentence | null>(null)
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedList, setSavedList] = useState<Sentence[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSentences()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadSaved()
  }, [user])

  async function loadSentences() {
    const { data } = await supabase
      .from('sentences')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setSentences(data as Sentence[])
  }

  async function loadSaved() {
    const { data } = await supabase
      .from('saved_sentences')
      .select('sentence_id, sentences(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) {
      const list = data.map((r: any) => r.sentences as Sentence)
      setSavedList(list)
      setSavedIds(new Set(list.map(s => s.id)))
    }
  }

  async function saveSentence() {
    if (!sentence) return
    if (!user) { setShowAuth(true); return }
    const { error } = await supabase
      .from('saved_sentences')
      .insert({ user_id: user.id, sentence_id: sentence.id })
    if (!error) {
      setSaved(true)
      setSavedIds(ids => new Set([...ids, sentence.id]))
    }
  }

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
      // Auto-save to Mine if signed in
      if (user) {
        await supabase
          .from('saved_sentences')
          .insert({ user_id: user.id, sentence_id: data.id })
          .select()
        setSaved(true)
        setSavedIds(ids => new Set([...ids, data.id]))
        await loadSaved()
      } else {
        setSaved(false)
      }
      setView('breakdown')
      setInput('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function openSentence(s: Sentence) {
    setSentence(s)
    setSaved(savedIds.has(s.id))
    setView('breakdown')
  }

  const grouped = DIFFICULTY_ORDER.reduce((acc, d) => {
    const group = sentences.filter(s => (s.difficulty ?? 'Intermediate') === d)
    if (group.length > 0) acc[d] = group
    return acc
  }, {} as Partial<Record<Difficulty, Sentence[]>>)

  const displayList = listFilter === 'mine' ? savedList : null

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Nav */}
      <nav style={{
        background: '#16324F', padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 48,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', color: 'white', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em' }}>
          Ms. Gramm
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {view !== 'list' && (
            <button onClick={() => setView('list')} style={navBtn}>← Sentences</button>
          )}
          {view !== 'enter' && (
            <button onClick={() => setView('enter')} style={navBtn}>Enter a sentence</button>
          )}
          {user ? (
            <button onClick={() => supabase.auth.signOut()} style={navBtn}>Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ ...navBtn, borderColor: 'rgba(255,255,255,0.6)', color: 'white' }}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 860, padding: '40px 48px' }}>

        {/* List view */}
        {view === 'list' && (
          <div>
            {/* All / Mine toggle */}
            {user && (
              <div style={{ display: 'flex', marginBottom: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid #D8D4CC', width: 'fit-content' }}>
                {(['all', 'mine'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setListFilter(f)}
                    style={{
                      padding: '7px 24px', fontSize: '0.8rem', fontWeight: 500,
                      cursor: 'pointer', border: 'none',
                      background: listFilter === f ? '#1B3A5C' : 'white',
                      color: listFilter === f ? 'white' : '#666',
                    }}
                  >
                    {f === 'all' ? 'All' : 'Mine'}
                  </button>
                ))}
              </div>
            )}

            {/* All — grouped by difficulty */}
            {listFilter === 'all' && (
              DIFFICULTY_ORDER.filter(d => grouped[d]).map(d => (
                <div key={d} style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 12 }}>
                    {d}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {grouped[d]!.map(s => (
                      <SentenceRow key={s.id} s={s} onClick={() => openSentence(s)} saved={savedIds.has(s.id)} />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Mine */}
            {listFilter === 'mine' && (
              savedList.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No saved sentences yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savedList.map(s => (
                    <SentenceRow key={s.id} s={s} onClick={() => openSentence(s)} saved showDifficulty />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Breakdown view */}
        {view === 'breakdown' && sentence && (
          <Breakdown
            sentence={sentence}
            saved={saved}
            onSave={saveSentence}
            saveLabel={user ? 'Save' : 'Sign in to save'}
          />
        )}

        {/* Enter view */}
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
                boxSizing: 'border-box',
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

      </main>
    </>
  )
}

function SentenceRow({ s, onClick, saved, showDifficulty }: {
  s: Sentence
  onClick: () => void
  saved?: boolean
  showDifficulty?: boolean
}) {
  const [hover, setHover] = useState(false)
  const dc = s.difficulty ? DIFFICULTY_COLORS[s.difficulty] : null

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', padding: '14px 18px', borderRadius: 8,
        border: `1px solid ${hover ? '#1B3A5C' : '#E8E4DC'}`,
        background: hover ? '#F8F9FB' : 'white',
        cursor: 'pointer', width: '100%',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1rem', marginBottom: 4 }}>
            {s.text}
          </div>
          {s.breakdown?.translation && (
            <div style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
              {s.breakdown.translation}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {showDifficulty && dc && s.difficulty && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
              background: dc.bg, color: dc.color,
            }}>
              {s.difficulty}
            </span>
          )}
          {saved && (
            <span style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: 500 }}>✓ Saved</span>
          )}
        </div>
      </div>
    </button>
  )
}

const navBtn: React.CSSProperties = {
  fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
  padding: '4px 14px', cursor: 'pointer',
}
