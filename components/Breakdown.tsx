'use client'

import { useState, useEffect, useRef } from 'react'
import { Sentence, Topic } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import WordEntry from './WordEntry'

type Props = {
  sentence: Sentence
  saved?: boolean
  onSave?: () => void
  userTags?: string[]
  onUserTagsChange?: (tags: string[]) => void
  onFeedback?: () => void
}

export default function Breakdown({
  sentence, saved, onSave, userTags, onUserTagsChange, onFeedback,
}: Props) {
  const [mode, setMode] = useState<'study' | 'quiz'>('study')
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')
  const [showTranslation, setShowTranslation] = useState(true)
  const [showContext, setShowContext] = useState(false)
  const [showPeek, setShowPeek] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [topicByType, setTopicByType] = useState<Record<string, string>>({})
  const activeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.from('topics').select('slug, word_type').not('word_type', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        data.forEach((t: Pick<Topic, 'slug' | 'word_type'>) => { if (t.word_type) map[t.word_type] = t.slug })
        setTopicByType(map)
      })
  }, [])

  useEffect(() => { setRevealed({}) }, [mode])

  const { words, translation, explanation, trap } = sentence.breakdown
  const types = [...new Set(words.map(w => w.type))]
  const cases = [...new Set(words.map(w => w.case).filter(Boolean))]
  const genders = [...new Set(words.map(w => w.gender).filter(Boolean))]

  function handleWordClick(wid: number) {
    setActiveId(wid)
    if (activeTimer.current) clearTimeout(activeTimer.current)
    activeTimer.current = setTimeout(() => setActiveId(null), 1400)
    const el = document.getElementById(`entry-${wid}`)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  function toggleReveal(key: string) {
    setRevealed(prev => ({ ...prev, [key]: true }))
  }

  function revealAll(wid: number) {
    const word = words.find(w => w.wid === wid)
    if (!word) return
    const keys: string[] = [`${wid}.role`]
    const propFields = ['case', 'gender', 'number', 'tense', 'person'] as const
    propFields.forEach(k => { if (word[k]) keys.push(`${wid}.${k}`) })
    setRevealed(prev => {
      const next = { ...prev }
      keys.forEach(k => { next[k] = true })
      return next
    })
  }

  const filtered = filter === 'all' ? words : words.filter(w => w.type === filter)

  return (
    <>
      {/* ── Specimen ── */}
      <div className="mg-specimen-block">
        <div className="mg-eyebrow">A sentence, broken down</div>
        <p className="mg-specimen">
          {words.map((w, i) => (
            <span key={w.wid}>
              <span
                className="mg-word"
                data-hovered={hoveredId === w.wid ? 'true' : undefined}
                data-active={activeId === w.wid ? 'true' : undefined}
                data-dim={filter !== 'all' && w.type !== filter ? 'true' : undefined}
                onMouseEnter={(e) => {
                  setHoveredId(w.wid)
                  if (showPeek) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
                  }
                }}
                onMouseLeave={() => { setHoveredId(null); setTooltipPos(null) }}
                onClick={() => handleWordClick(w.wid)}
              >
                <span className="mg-word-num">{String(w.wid).padStart(2, '0')}</span>
                {w.word}
              </span>
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
          .
        </p>
        {showTranslation && translation && (
          <p className="mg-translation">&ldquo;{translation}&rdquo;</p>
        )}
        {showContext && (sentence.ctx_before || sentence.ctx_after) && (
          <div className="mg-context">
            {sentence.ctx_before && <span>{sentence.ctx_before} </span>}
            <span className="focus">{sentence.text}</span>
            {sentence.ctx_after && <span> {sentence.ctx_after}</span>}
            {(sentence.ctx_before_translation || sentence.ctx_after_translation) && (
              <span className="en">
                {sentence.ctx_before_translation && `${sentence.ctx_before_translation} `}
                {translation}
                {sentence.ctx_after_translation && ` ${sentence.ctx_after_translation}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Plaque ── */}
      <div className="mg-plaque">
        <div className="mg-plaque-stats">
          <span><strong>{sentence.language}</strong></span>
          <span><strong>{words.length}</strong>&nbsp;words</span>
          {cases.length > 0 && <span><strong>{cases.length}</strong>&nbsp;cases</span>}
          {genders.length > 0 && <span><strong>{genders.length}</strong>&nbsp;genders</span>}
        </div>
        <div className="mg-plaque-actions">
          {(sentence.ctx_before || sentence.ctx_after) && (
            <button
              className="mg-action"
              aria-pressed={showContext ? 'true' : 'false'}
              onClick={() => setShowContext(v => !v)}
            >
              In paragraph
            </button>
          )}
          {onSave !== undefined && (
            <button
              className="mg-action"
              aria-pressed={saved ? 'true' : 'false'}
              onClick={saved ? undefined : onSave}
              style={saved ? { cursor: 'default' } : undefined}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
          {onFeedback && (
            <button className="mg-action" onClick={onFeedback}>
              Report
            </button>
          )}
        </div>
      </div>

      {/* ── Controls row: mode + translate ── */}
      <div className="mg-controls-row">
        <div className="mg-mode-toggle">
          <button
            aria-pressed={mode === 'study' ? 'true' : 'false'}
            onClick={() => setMode('study')}
          >
            Study
          </button>
          <button
            aria-pressed={mode === 'quiz' ? 'true' : 'false'}
            onClick={() => setMode('quiz')}
          >
            Quiz
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <div className="mg-mode-toggle">
            <button
              aria-pressed={showTranslation ? 'true' : 'false'}
              onClick={() => setShowTranslation(v => !v)}
            >
              Translate
            </button>
          </div>
          <div className="mg-mode-toggle">
            <button
              aria-pressed={showPeek ? 'true' : 'false'}
              onClick={() => setShowPeek(v => !v)}
            >
              Peek
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="mg-filters">
        <span className="mg-filters-label">Filter</span>
        <button
          className="mg-filter"
          aria-pressed={filter === 'all' ? 'true' : 'false'}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {types.map(type => {
          const count = words.filter(w => w.type === type).length
          return (
            <button
              key={type}
              className="mg-filter"
              aria-pressed={filter === type ? 'true' : 'false'}
              onClick={() => setFilter(filter === type ? 'all' : type)}
            >
              {type}<span className="count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Lexicon ── */}
      <div className="mg-entries">
        {filtered.map(w => (
          <div key={w.wid} id={`entry-${w.wid}`}>
            <WordEntry
              entry={w}
              mode={mode}
              isHovered={hoveredId === w.wid}
              isActive={activeId === w.wid}
              revealed={revealed}
              topicSlug={topicByType[w.type]}
              onMouseEnter={() => setHoveredId(w.wid)}
              onMouseLeave={() => setHoveredId(null)}
              onReveal={toggleReveal}
              onRevealAll={() => revealAll(w.wid)}
            />
          </div>
        ))}
      </div>

      {/* ── Insight Band ── */}
      {explanation && (
        <div className="mg-insight">
          <div className="mg-insight-eyebrow">The Pattern</div>
          <p className="mg-insight-body">{explanation}</p>
        </div>
      )}

      {/* ── Grammar Trap ── */}
      {trap && (
        <div className="mg-trap">
          <div className="mg-trap-eyebrow">Grammar Trap</div>
          <p className="mg-trap-body">{trap}</p>
        </div>
      )}

      {/* ── Peek tooltip ── */}
      {showPeek && tooltipPos && hoveredId !== null && (() => {
        const word = words.find(w => w.wid === hoveredId)
        if (!word) return null
        return <WordTooltip word={word} x={tooltipPos.x} y={tooltipPos.y} />
      })()}

      {/* ── Tags ── */}
      {(sentence.tags?.length > 0 || onUserTagsChange !== undefined) && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 48, paddingTop: 32, borderTop: 'var(--border-rule)' }}>
          {sentence.tags?.length > 0 && (
            <div>
              <div style={tagLabel}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sentence.tags.map(t => (
                  <span key={t} style={tagChip}>#{t}</span>
                ))}
              </div>
            </div>
          )}
          {onUserTagsChange !== undefined && (
            <div>
              <div style={tagLabel}>My tags</div>
              <UserTags tags={userTags ?? []} onChange={onUserTagsChange} />
            </div>
          )}
        </div>
      )}
    </>
  )
}

const PROP_FIELDS = ['case', 'gender', 'number', 'tense', 'person'] as const

function WordTooltip({ word, x, y }: { word: import('@/lib/types').WordEntry; x: number; y: number }) {
  const props = PROP_FIELDS
    .filter(k => word[k] != null && word[k] !== '')
    .map(k => [k, word[k] as string] as [string, string])

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y - 8,
        transform: 'translate(-50%, -100%)',
        zIndex: 90,
        background: 'var(--mist)',
        border: 'var(--border-hair)',
        boxShadow: '0 2px 8px rgba(30,30,46,0.10), 0 8px 24px rgba(30,30,46,0.06)',
        padding: '18px 20px',
        maxWidth: 320,
        minWidth: 220,
        pointerEvents: 'none',
      }}
    >
      {/* Number + POS */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--ink-40)', marginBottom: 8, display: 'flex', gap: 8 }}>
        {String(word.wid).padStart(2, '0')}
        <span style={{ color: 'var(--ink-60)', textTransform: 'uppercase' }}>{word.type}</span>
      </div>

      {/* Word + gloss */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: props.length ? 14 : 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 'clamp(20px,2vw,24px)', fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          {word.word}
        </span>
        {word.translation && (
          <span style={{ fontFamily: 'var(--display)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-60)' }}>
            &ldquo;{word.translation}&rdquo;
          </span>
        )}
      </div>

      {/* Lemma */}
      {word.form && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-60)', marginBottom: 12 }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-40)', marginRight: 6 }}>Lemma</span>
          {word.form}
        </div>
      )}

      {/* Props */}
      {props.length > 0 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--ink-10)' }}>
          {props.map(([k, v]) => (
            <div key={k}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)', display: 'block', marginBottom: 3 }}>{k}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Role */}
      {word.job && (
        <p style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 300, lineHeight: 1.45, color: 'var(--ink)', margin: 0, marginBottom: word.note ? 10 : 0 }}>
          {word.job}
        </p>
      )}

      {/* Note */}
      {word.note && (
        <p style={{ fontFamily: 'var(--display)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-60)', margin: 0, paddingLeft: 12, borderLeft: '1px solid var(--ink-20)' }}>
          {word.note}
        </p>
      )}
    </div>
  )
}

function UserTags({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-')
    if (!val || tags.includes(val)) { setInput(''); return }
    onChange([...tags, val])
    setInput('')
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ ...tagChip, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bone-d)' }}>
            #{t}
            <button
              onClick={() => onChange(tags.filter(x => x !== t))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-60)', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add a tag…"
          style={{
            fontFamily: 'var(--mono)', fontSize: '12px', padding: '5px 10px',
            border: 'var(--border-hair)', background: 'var(--white)', outline: 'none', width: 140,
            color: 'var(--ink)',
          }}
        />
        <button
          onClick={add}
          style={{
            fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '5px 12px', border: 'var(--border-hair)', background: 'transparent',
            cursor: 'pointer', color: 'var(--ink-60)',
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

const tagLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-40)',
  marginBottom: 8,
}

const tagChip: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '12px',
  padding: '3px 10px',
  background: 'var(--bone-d)',
  color: 'var(--ink-60)',
}
