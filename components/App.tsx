'use client'

import { useState, useEffect } from 'react'
import { Sentence, Difficulty } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { LANGUAGES } from '@/lib/languages'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Breakdown from './Breakdown'
import AuthModal from './AuthModal'
import ChatPanel from './ChatPanel'

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
  const [langFilter, setLangFilter] = useState<string>('all')
  const [inputLang, setInputLang] = useState<string>(LANGUAGES[0].code)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedList, setSavedList] = useState<Sentence[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [userTagsMap, setUserTagsMap] = useState<Record<string, string[]>>({})

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
      const tagsMap: Record<string, string[]> = {}
      data.forEach((r: any) => { tagsMap[r.sentences.id] = r.user_tags ?? [] })
      setUserTagsMap(tagsMap)
    }
  }

  async function updateUserTags(sentenceId: string, tags: string[]) {
    await supabase
      .from('saved_sentences')
      .update({ user_tags: tags })
      .eq('user_id', user!.id)
      .eq('sentence_id', sentenceId)
    setUserTagsMap(m => ({ ...m, [sentenceId]: tags }))
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
        body: JSON.stringify({ sentence: input.trim(), language: inputLang }),
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

  function openNextSentence() {
    if (!sentence) return
    const list = langFilter === 'all' ? sentences : sentences.filter(s => s.language === langFilter)
    const idx = list.findIndex(s => s.id === sentence.id)
    const next = list[idx + 1] ?? list[0]
    if (next && next.id !== sentence.id) openSentence(next)
  }

  const visibleSentences = langFilter === 'all'
    ? sentences
    : sentences.filter(s => s.language === langFilter)

  const grouped = DIFFICULTY_ORDER.reduce((acc, d) => {
    const group = visibleSentences.filter(s => (s.difficulty ?? 'Intermediate') === d)
    if (group.length > 0) acc[d] = group
    return acc
  }, {} as Partial<Record<Difficulty, Sentence[]>>)

  const activeLangs = [...new Set(sentences.map(s => s.language))]

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
          <Link href="/topics" style={navBtn}>Topics</Link>
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

            {/* Language filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {[{ code: 'all', label: 'All' }, ...LANGUAGES].map(({ code, label }) => {
                const active = langFilter === code
                return (
                  <button
                    key={code}
                    onClick={() => setLangFilter(code)}
                    style={{
                      padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem',
                      fontWeight: 500, cursor: 'pointer',
                      background: active ? '#1B3A5C' : 'white',
                      color: active ? 'white' : '#666',
                      border: `1px solid ${active ? '#1B3A5C' : '#D8D4CC'}`,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Column headers */}
            <TableHeader showDifficulty={listFilter === 'mine'} />

            {/* All — grouped by difficulty */}
            {listFilter === 'all' && (
              DIFFICULTY_ORDER.filter(d => grouped[d]).map(d => (
                <div key={d} style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', margin: '20px 0 4px' }}>
                    {d}
                  </div>
                  {grouped[d]!.map((s, i) => (
                    <SentenceRow key={s.id} s={s} onClick={() => openSentence(s)} saved={savedIds.has(s.id)} striped={i % 2 === 1} />
                  ))}
                </div>
              ))
            )}

            {/* Mine */}
            {listFilter === 'mine' && (
              savedList.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem', marginTop: 16 }}>No saved sentences yet.</p>
              ) : (
                savedList.map((s, i) => (
                  <SentenceRow key={s.id} s={s} onClick={() => openSentence(s)} saved showDifficulty striped={i % 2 === 1} />
                ))
              )
            )}
          </div>
        )}

        {/* Breakdown view */}
        {view === 'breakdown' && sentence && (
          <>
            <Breakdown
              sentence={sentence}
              saved={saved}
              onSave={saveSentence}
              saveLabel={user ? 'Save' : 'Sign in to save'}
              userTags={saved ? (userTagsMap[sentence.id] ?? []) : undefined}
              onUserTagsChange={saved ? (tags) => updateUserTags(sentence.id, tags) : undefined}
              onNextSentence={openNextSentence}
            />
            <ChatPanel sentence={sentence} userId={user?.id} />
          </>
        )}

        {/* Enter view */}
        {view === 'enter' && (
          <div style={{ maxWidth: 600 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1B3A5C', marginBottom: 8 }}>
              Type a sentence to break down.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 16 }}>
              Works best with complete sentences. Interesting grammar makes for a better breakdown.
            </p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setInputLang(l.code)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem',
                    fontWeight: 500, cursor: 'pointer',
                    background: inputLang === l.code ? '#1B3A5C' : 'white',
                    color: inputLang === l.code ? 'white' : '#666',
                    border: `1px solid ${inputLang === l.code ? '#1B3A5C' : '#D8D4CC'}`,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
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

function TableHeader({ showDifficulty }: { showDifficulty?: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: showDifficulty ? '35% 35% 10% 10% 10%' : '45% 45% 10%',
      padding: '6px 18px',
      borderBottom: '2px solid #E8E4DC',
    }}>
      <span style={headerCell}>Sentence</span>
      <span style={headerCell}>Translation</span>
      <span style={{ ...headerCell, textAlign: 'right' }}>Language</span>
      {showDifficulty && <span style={{ ...headerCell, textAlign: 'center' }}>Difficulty</span>}
      {showDifficulty && <span style={{ ...headerCell, textAlign: 'center' }}>Saved</span>}
    </div>
  )
}

function SentenceRow({ s, onClick, saved, showDifficulty, striped }: {
  s: Sentence
  onClick: () => void
  saved?: boolean
  showDifficulty?: boolean
  striped?: boolean
}) {
  const [hover, setHover] = useState(false)
  const dc = s.difficulty ? DIFFICULTY_COLORS[s.difficulty] : null

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: showDifficulty ? '35% 35% 10% 10% 10%' : '45% 45% 10%',
        alignItems: 'center',
        textAlign: 'left',
        padding: '10px 18px',
        border: 'none',
        borderBottom: '1px solid #F0EDE8',
        background: hover ? '#F0F4F8' : striped ? '#FAFAF8' : 'white',
        cursor: 'pointer', width: '100%',
        transition: 'background 0.12s',
      }}
    >
      <span style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '0.95rem', paddingRight: 16 }}>
        {s.text}
      </span>
      <span style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', paddingRight: 16 }}>
        {s.breakdown?.translation ?? ''}
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: '#F0EDE8', color: '#888', letterSpacing: '0.04em',
        }}>
          {LANGUAGES.find(l => l.code === s.language)?.label ?? s.language}
        </span>
      </span>
      {showDifficulty && (
        <span style={{ textAlign: 'center' }}>
          {dc && s.difficulty && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: dc.bg, color: dc.color,
            }}>
              {s.difficulty}
            </span>
          )}
        </span>
      )}
      {showDifficulty && (
        <span style={{ textAlign: 'center', fontSize: '0.75rem', color: '#27ae60', fontWeight: 500 }}>
          {saved ? '✓' : ''}
        </span>
      )}
    </button>
  )
}

const headerCell: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#AAA',
}

const navBtn: React.CSSProperties = {
  fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
  padding: '4px 14px', cursor: 'pointer',
}
