'use client'

import { useState } from 'react'
import { Sentence } from '@/lib/types'
import { BADGE_COLORS, HIGHLIGHT_COLORS } from '@/lib/wordTypes'
import WordEntry from './WordEntry'

export default function Breakdown({ sentence }: { sentence: Sentence }) {
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [quizMode, setQuizMode] = useState(false)
  const [showContext, setShowContext] = useState(false)

  const { words, explanation, trap } = sentence.breakdown
  const types = [...new Set(words.map(w => w.type))]
  const filtered = activeFilter === 'all' ? words : words.filter(w => w.type === activeFilter)

  return (
    <div>

      {/* Sentence */}
      <div className="mb-10 pb-8" style={{ borderBottom: '1px solid #E8E4DC' }}>
        <p className="text-xl leading-relaxed mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C' }}>
          {showContext && sentence.ctx_before && (
            <span className="text-gray-400 italic">{sentence.ctx_before} </span>
          )}
          <span>
            {words.map((w, i) => {
              const hlColors = HIGHLIGHT_COLORS[w.type]
              const isHl = highlighted === w.wid
              return (
                <span key={w.wid}>
                  <span
                    className="rounded px-0.5 transition-colors cursor-default"
                    style={isHl && hlColors ? { background: hlColors.bg, color: hlColors.color } : {}}
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
            <span className="text-gray-400 italic"> {sentence.ctx_after}</span>
          )}
        </p>

        {(sentence.ctx_before || sentence.ctx_after) && (
          <button
            onClick={() => setShowContext(v => !v)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{ borderColor: '#D8D4CC', color: '#888', background: 'white' }}
          >
            {showContext ? 'Hide paragraph' : 'In paragraph'}
          </button>
        )}
      </div>

      {/* Word by Word header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#999' }}>Word by Word</h2>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#D8D4CC' }}>
          {(['Study', 'Quiz'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setQuizMode(mode === 'Quiz')}
              className="px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
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
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveFilter('all')}
          className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
          style={{
            background: activeFilter === 'all' ? '#1B3A5C' : 'white',
            color: activeFilter === 'all' ? 'white' : '#666',
            borderColor: activeFilter === 'all' ? '#1B3A5C' : '#D8D4CC',
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
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={{
                background: active ? colors?.color ?? '#555' : colors?.bg ?? '#EEE',
                color: active ? 'white' : colors?.color ?? '#333',
                borderColor: colors?.color ?? '#CCC',
              }}
            >
              {type}
            </button>
          )
        })}
      </div>

      {/* Word grid — newspaper 2-column */}
      <div className="columns-2 gap-4 mb-10" style={{ columnFill: 'balance' }}>
        {filtered.map(entry => (
          <div key={entry.wid} className="break-inside-avoid mb-4">
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
      <div className="rounded-lg p-6 mb-5" style={{ background: '#F0F4F8', borderLeft: '4px solid #1B3A5C' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#1B3A5C' }}>
          Explanation
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{explanation}</p>
      </div>

      {/* Grammar Trap */}
      <div className="rounded-lg p-6" style={{ background: '#FEF9E7', borderLeft: '4px solid #8B5E00' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#8B5E00' }}>
          Grammar Trap
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{trap}</p>
      </div>

    </div>
  )
}
