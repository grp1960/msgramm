'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sentence, Difficulty } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { LANGUAGES } from '@/lib/languages'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import AuthModal from './AuthModal'
import FeedbackModal from './FeedbackModal'

const DIFFICULTY_ORDER: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const TAXONOMY = [
  {
    category: 'Verbs',
    concepts: [
      { id: 'separable-verbs',  label: 'Separable Verbs' },
      { id: 'konjunktiv-ii',   label: 'Konjunktiv II' },
      { id: 'modal-verbs',     label: 'Modal Verbs' },
      { id: 'passive-voice',   label: 'Passive Voice' },
      { id: 'reflexive-verbs', label: 'Reflexive Verbs' },
      { id: 'verb-tenses',     label: 'Tenses' },
    ],
  },
  {
    category: 'Nouns',
    concepts: [
      { id: 'case-nominative', label: 'Nominative' },
      { id: 'case-accusative', label: 'Accusative' },
      { id: 'case-dative',     label: 'Dative' },
      { id: 'case-genitive',   label: 'Genitive' },
      { id: 'noun-gender',     label: 'Gender' },
      { id: 'pluralisation',   label: 'Pluralisation' },
    ],
  },
  {
    category: 'Pronouns',
    concepts: [
      { id: 'personal-pronouns',     label: 'Personal' },
      { id: 'relative-pronouns',     label: 'Relative' },
      { id: 'demonstrative-pronouns',label: 'Demonstrative' },
      { id: 'indefinite-pronouns',   label: 'Indefinite' },
    ],
  },
  {
    category: 'Adjectives',
    concepts: [
      { id: 'adjective-declension', label: 'Declension' },
      { id: 'adjective-comparison', label: 'Comparison' },
      { id: 'adverbs',              label: 'Adverbs' },
    ],
  },
  {
    category: 'Prepositions',
    concepts: [
      { id: 'two-way-preps',     label: 'Two-Way Preps' },
      { id: 'accusative-preps',  label: 'Accusative Preps' },
      { id: 'dative-preps',      label: 'Dative Preps' },
      { id: 'genitive-preps',    label: 'Genitive Preps' },
    ],
  },
  {
    category: 'Syntax',
    concepts: [
      { id: 'verb-second',               label: 'Verb-Second Rule' },
      { id: 'subordinate-clauses',       label: 'Subordinate Clauses' },
      { id: 'coordinating-conjunctions', label: 'Coord. Conjunctions' },
      { id: 'negation',                  label: 'Negation' },
      { id: 'tekamolo',                  label: 'TeKaMoLo' },
    ],
  },
]

type View = 'list' | 'enter'
type ListFilter = 'all' | 'mine'

export default function App() {
  const router = useRouter()
  const [view, setView] = useState<View>('list')
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [langFilter, setLangFilter] = useState<string>('all')
  const [conceptFilter, setConceptFilter] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [inputLang, setInputLang] = useState<string>(LANGUAGES[0].code)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [savedList, setSavedList] = useState<Sentence[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [showFeedback, setShowFeedback] = useState(false)

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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 422) throw new Error(body.message ?? "This doesn't look like a natural language sentence.")
        throw new Error(body.error ?? 'Something went wrong. Please try again.')
      }
      const data = await res.json()
      if (user) {
        await supabase.from('saved_sentences').insert({ user_id: user.id, sentence_id: data.id }).select()
        setSavedIds(ids => new Set([...ids, data.id]))
        await loadSaved()
      }
      router.push('/sentences/' + data.id + '?new=1')
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function openSentence(s: Sentence) {
    router.push('/sentences/' + s.id)
  }

  const sourceList = listFilter === 'mine' ? savedList : sentences
  const visibleSentences = sourceList
    .filter(s => langFilter === 'all' || s.language === langFilter)
    .filter(s => !conceptFilter || (s.concepts ?? []).includes(conceptFilter))

  const grouped = DIFFICULTY_ORDER.reduce((acc, d) => {
    const group = visibleSentences.filter(s => (s.difficulty ?? 'Intermediate') === d)
    if (group.length > 0) acc[d] = group
    return acc
  }, {} as Partial<Record<Difficulty, Sentence[]>>)

  const displaySentences = visibleSentences

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showFeedback && (
        <FeedbackModal scope="general" userId={user?.id} userEmail={user?.email} onClose={() => setShowFeedback(false)} />
      )}

      {/* Loading overlay */}
      {loading && <BreakdownLoader sentence={input} />}

      <div className="mg-shell">

        {/* Header */}
        <header className="mg-header">
          <Link href="/" className="mg-wordmark">
            Ms<span className="dot" />Gramm
          </Link>

          <div className="mg-header-meta">
            <span>Sentence Breakdown</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {view === 'enter' ? (
              <button onClick={() => setView('list')} style={monoLink}>← Sentences</button>
            ) : (
              <button onClick={() => setView('enter')} style={monoLink}>+ Enter a sentence</button>
            )}
            <Link href="/topics" style={monoLink}>Topics</Link>
            <button onClick={() => setShowFeedback(true)} style={{ ...monoLink, background: 'transparent', border: 0, cursor: 'pointer' }}>Feedback</button>
            {user ? (
              <button onClick={() => supabase.auth.signOut()} style={{ ...monoLink, background: 'transparent', border: 0, cursor: 'pointer' }}>Sign out</button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ ...monoLink, background: 'transparent', border: 0, cursor: 'pointer' }}>Sign in</button>
            )}
          </div>
        </header>

        {/* ── List view ── */}
        {view === 'list' && (
          <div>
            {/* Toolbar: All/Mine + language filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
              {user && (
                <div className="mg-mode-toggle">
                  {(['all', 'mine'] as const).map(f => (
                    <button
                      key={f}
                      aria-pressed={listFilter === f ? 'true' : 'false'}
                      onClick={() => setListFilter(f)}
                    >
                      {f === 'all' ? 'All' : 'Mine'}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[{ code: 'all', label: 'All languages' }, ...LANGUAGES].map(({ code, label }) => (
                  <button
                    key={code}
                    className="mg-filter"
                    aria-pressed={langFilter === code ? 'true' : 'false'}
                    onClick={() => setLangFilter(code)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grammar concept browser */}
            <div style={{ borderTop: 'var(--border-rule)', paddingTop: 16, marginTop: 8 }}>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', marginBottom: 12 }}>
                {TAXONOMY.map(t => (
                  <button
                    key={t.category}
                    onClick={() => {
                      if (activeCategory === t.category) {
                        setActiveCategory(null)
                        setConceptFilter(null)
                      } else {
                        setActiveCategory(t.category)
                        setConceptFilter(null)
                      }
                    }}
                    style={{
                      fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em',
                      textTransform: 'uppercase', border: 'var(--border-hair)',
                      borderRight: 'none', padding: '6px 14px', cursor: 'pointer',
                      background: activeCategory === t.category ? 'var(--ink)' : 'transparent',
                      color: activeCategory === t.category ? 'var(--bone)' : 'var(--ink-60)',
                      transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
                    }}
                  >
                    {t.category}
                  </button>
                ))}
                <div style={{ flex: 1, borderBottom: 'var(--border-hair)' }} />
              </div>

              {/* Concept chips for active category */}
              {activeCategory && (() => {
                const cat = TAXONOMY.find(t => t.category === activeCategory)!
                const allIds = sentences.flatMap(s => s.concepts ?? [])
                return (
                  <div className="mg-concept-row" style={{ paddingTop: 0, borderTop: 'none', marginTop: 0 }}>
                    {cat.concepts.map(c => {
                      const hasContent = allIds.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          className="mg-concept"
                          aria-pressed={conceptFilter === c.id ? 'true' : 'false'}
                          disabled={!hasContent}
                          onClick={() => setConceptFilter(conceptFilter === c.id ? null : c.id)}
                          style={!hasContent ? {
                            opacity: 0.35, cursor: 'default',
                            borderStyle: 'dashed',
                          } : undefined}
                        >
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* All — grouped by difficulty */}
            {listFilter === 'all' && (
              DIFFICULTY_ORDER.filter(d => grouped[d]).map(d => (
                <div key={d}>
                  <div className="mg-eyebrow" style={{ marginTop: 48, marginBottom: 0 }}>{d}</div>
                  {grouped[d]!.map(s => (
                    <SentenceRow key={s.id} s={s} onClick={() => openSentence(s)} saved={savedIds.has(s.id)} />
                  ))}
                </div>
              ))
            )}

            {/* Mine */}
            {listFilter === 'mine' && (
              displaySentences.length === 0 ? (
                <p style={{ fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-40)', marginTop: 48 }}>
                  No saved sentences yet.
                </p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {displaySentences.map(s => (
                    <SentenceRow key={s.id} s={s} onClick={() => openSentence(s)} saved />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ── Enter view ── */}
        {view === 'enter' && (
          <div style={{ maxWidth: 680 }}>
            <div className="mg-eyebrow" style={{ marginBottom: 32 }}>Break down a sentence</div>

            {/* Language picker */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24 }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className="mg-filter"
                  aria-pressed={inputLang === l.code ? 'true' : 'false'}
                  onClick={() => setInputLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="e.g. Er hatte das Buch schon gelesen, bevor sie ankam."
              maxLength={300}
              style={{
                width: '100%',
                fontFamily: 'var(--display)', fontWeight: 300,
                fontSize: 'clamp(18px, 2vw, 24px)',
                letterSpacing: '-0.02em', lineHeight: 1.5,
                color: 'var(--ink)', background: 'transparent',
                border: 'none', borderBottom: 'var(--border-hair)',
                padding: '12px 0', outline: 'none',
                resize: 'none', minHeight: 80,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.06em', color: 'var(--ink-40)' }}>
                {input.length} / 300
              </span>
              {error && (
                <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: '#8B3A3A' }}>{error}</span>
              )}
            </div>

            <button
              onClick={submit}
              disabled={loading || input.trim().length < 4}
              style={{
                marginTop: 28,
                fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: loading || input.trim().length < 4 ? 'var(--ink-20)' : 'var(--ink)',
                color: 'var(--bone)', border: 0,
                padding: '12px 28px', cursor: loading || input.trim().length < 4 ? 'default' : 'pointer',
                transition: 'background var(--dur-fast) var(--ease)',
              }}
            >
              Break it down
            </button>
          </div>
        )}

      </div>
    </>
  )
}

function SentenceRow({ s, onClick, saved }: { s: Sentence; onClick: () => void; saved?: boolean }) {
  const [hover, setHover] = useState(false)
  const langLabel = LANGUAGES.find(l => l.code === s.language)?.label ?? s.language

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 24, width: '100%', textAlign: 'left',
        padding: '18px 0', border: 0,
        borderBottom: 'var(--border-rule)',
        background: hover ? 'var(--bone-d)' : 'transparent',
        cursor: 'pointer',
        transition: 'background var(--dur-fast) var(--ease)',
        paddingLeft: hover ? 12 : 0,
        paddingRight: hover ? 12 : 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--display)', fontWeight: 300,
          fontSize: 'clamp(16px, 1.6vw, 20px)', letterSpacing: '-0.02em',
          color: 'var(--ink)', lineHeight: 1.35,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {s.text}
        </p>
        {s.breakdown?.translation && (
          <p style={{
            fontFamily: 'var(--display)', fontStyle: 'italic', fontWeight: 300,
            fontSize: 14, color: 'var(--ink-60)', marginTop: 3, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {s.breakdown.translation}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {saved && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-40)' }}>
            Saved
          </span>
        )}
        {s.difficulty && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-40)' }}>
            {s.difficulty}
          </span>
        )}
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-60)' }}>
          {langLabel}
        </span>
      </div>
    </button>
  )
}

const monoLink: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-60)',
  textDecoration: 'none',
}

function BreakdownLoader({ sentence }: { sentence: string }) {
  const words = sentence.trim().replace(/[.!?]$/, '').split(/\s+/)
  const [activeIdx, setActiveIdx] = useState(0)
  const dir = useRef(1)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx(prev => {
        const next = prev + dir.current
        if (next >= words.length - 1) dir.current = -1
        if (next <= 0) dir.current = 1
        return next
      })
    }, 340)
    return () => clearInterval(id)
  }, [words.length])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'var(--bone)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: 40,
    }}>
      <p style={{
        fontFamily: 'var(--display)', fontWeight: 300,
        fontSize: 'clamp(20px, 2.4vw, 28px)', letterSpacing: '-0.025em',
        color: 'var(--ink)', maxWidth: 640, textAlign: 'center', lineHeight: 1.5,
      }}>
        {words.map((w, i) => (
          <span key={i}>
            <span style={{
              display: 'inline-block',
              padding: '0 3px', margin: '0 -3px',
              borderRadius: 2,
              background: i === activeIdx ? 'var(--ink)' : 'transparent',
              color: i === activeIdx ? 'var(--bone)' : 'var(--ink)',
              transition: 'background 0.25s, color 0.25s',
            }}>
              {w}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
      <p style={{
        fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ink-40)',
      }}>
        Breaking it down
      </p>
    </div>
  )
}
