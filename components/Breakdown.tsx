'use client'

import { useState } from 'react'
import { Sentence } from '@/lib/types'
import { BADGE_COLORS, HIGHLIGHT_COLORS } from '@/lib/wordTypes'
import WordEntry from './WordEntry'

type Props = {
  sentence: Sentence
  saved?: boolean
  onSave?: () => void
  saveLabel?: string
}

export default function Breakdown({ sentence, saved, onSave, saveLabel = 'Save' }: Props) {
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [quizMode, setQuizMode] = useState(false)
  const [showContext, setShowContext] = useState(false)

  const { words, translation, explanation, trap } = sentence.breakdown
  const types = [...new Set(words.map(w => w.type))]
  const filtered = activeFilter === 'all' ? words : words.filter(w => w.type === activeFilter)

  return (
    <div>

      {/* Sentence */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E8E4DC' }}>
        <p style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1.25rem', lineHeight: 1.7, marginBottom: 16 }}>
          {showContext && sentence.ctx_before && (
            <span style={{ color: '#aaa', fontStyle: 'italic' }}>{sentence.ctx_before} </span>
          )}
          <span>
            {words.map((w, i) => {
              const hlColors = HIGHLIGHT_COLORS[w.type]
              const isHl = highlighted === w.wid
              return (
                <span key={w.wid}>
                  <span
                    style={{
                      borderRadius: 3, padding: '0 2px', transition: 'background 0.15s',
                      cursor: 'default',
                      ...(isHl && hlColors ? { background: hlColors.bg, color: hlColors.color } : {}),
                    }}
                  >
                    {w.word}
                  </span>
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              )
            })}
            .
          </span>
          {showContext && sentence.ctx_after && (
            <span style={{ color: '#aaa', fontStyle: 'italic' }}> {sentence.ctx_after}</span>
          )}
        </p>

        {translation && (
          <p style={{ fontStyle: 'italic', color: '#888', fontSize: '1rem', marginBottom: 12, fontFamily: 'Georgia, serif' }}>
            {translation}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          {onSave !== undefined && (
            saved ? (
              <span style={{ fontSize: '0.85rem', color: '#27ae60', fontWeight: 500 }}>✓ Saved</span>
            ) : (
              <button onClick={onSave} style={{
                fontSize: '0.85rem', padding: '6px 18px', borderRadius: 6,
                border: '1px solid #1B3A5C', color: '#1B3A5C', background: 'white',
                cursor: 'pointer',
              }}>
                {saveLabel}
              </button>
            )
          )}
          {(sentence.ctx_before || sentence.ctx_after) && (
            <button
              onClick={() => setShowContext(v => !v)}
              style={{
                fontSize: '0.75rem', padding: '4px 14px', borderRadius: 20,
                border: '1px solid #D8D4CC', color: '#888', background: 'white', cursor: 'pointer',
              }}
            >
              {showContext ? 'Hide paragraph' : 'In paragraph'}
            </button>
          )}
        </div>

      </div>

      {/* Word by Word header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>
          Word by Word
        </h2>
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #D8D4CC' }}>
          {(['Study', 'Quiz'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setQuizMode(mode === 'Quiz')}
              style={{
                padding: '6px 18px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: 'none',
                background: (mode === 'Quiz') === quizMode ? '#1B3A5C' : 'white',
                color: (mode === 'Quiz') === quizMode ? 'white' : '#666',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveFilter('all')}
          style={{
            padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
            background: activeFilter === 'all' ? '#1B3A5C' : 'white',
            color: activeFilter === 'all' ? 'white' : '#666',
            border: `1px solid ${activeFilter === 'all' ? '#1B3A5C' : '#D8D4CC'}`,
          }}
        >
          All
        </button>
        {types.map(type => {
          const colors = BADGE_COLORS[type]
          const active = activeFilter === type
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(active ? 'all' : type)}
              style={{
                padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                background: active ? colors?.color ?? '#555' : colors?.bg ?? '#EEE',
                color: active ? 'white' : colors?.color ?? '#333',
                border: `1px solid ${colors?.color ?? '#CCC'}`,
              }}
            >
              {type}
            </button>
          )
        })}
      </div>

      {/* Word grid — newspaper 2-column */}
      <div style={{ columns: 2, columnGap: 16, columnFill: 'balance', marginBottom: 40 }}>
        {filtered.map(entry => (
          <div key={entry.wid} style={{ breakInside: 'avoid', marginBottom: 16 }}>
            <WordEntry
              entry={entry}
              highlighted={highlighted === entry.wid}
              quizMode={quizMode}
              onMouseEnter={() => setHighlighted(entry.wid)}
              onMouseLeave={() => setHighlighted(null)}
            />
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div style={{ borderRadius: 8, padding: '20px 24px', marginBottom: 16, background: '#F0F4F8', borderLeft: '4px solid #1B3A5C' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1B3A5C', marginBottom: 10 }}>
          Explanation
        </div>
        <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#444' }}>{explanation}</p>
      </div>

      {/* Grammar Trap */}
      <div style={{ borderRadius: 8, padding: '20px 24px', background: '#FEF9E7', borderLeft: '4px solid #8B5E00' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B5E00', marginBottom: 10 }}>
          Grammar Trap
        </div>
        <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#444' }}>{trap}</p>
      </div>

    </div>
  )
}
