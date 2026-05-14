'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Sentence } from '@/lib/types'
import { BADGE_COLORS } from '@/lib/wordTypes'

type Props = {
  sentence: Sentence
  onNextSentence?: () => void
}

const ALL_TYPES = Object.keys(BADGE_COLORS)

function makeOptions(correct: string, seed: number): string[] {
  // Deterministic shuffle using the word index as a seed so options don't
  // re-randomise on re-render — but still vary per word.
  const rng = (n: number) => ((seed * 2654435761 + n * 1234567) >>> 0) / 0xffffffff
  const pool = ALL_TYPES.filter(t => t !== correct)
    .map((t, i) => ({ t, r: rng(i) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 3)
    .map(x => x.t)
  const opts = [...pool, correct]
    .map((t, i) => ({ t, r: rng(i + 100) }))
    .sort((a, b) => a.r - b.r)
    .map(x => x.t)
  return opts
}

export default function QuizMode({ sentence, onNextSentence }: Props) {
  const { words } = sentence.breakdown
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  // Stable options per word, keyed by sentence id
  const optionsMap = useMemo(() => {
    const map: Record<number, string[]> = {}
    words.forEach((w, i) => { map[w.wid] = makeOptions(w.type, i) })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id])

  // Reset state when sentence changes
  useEffect(() => {
    setCurrentIdx(0)
    setAnswers({})
  }, [sentence.id])

  const navigate = useCallback((delta: number) => {
    setCurrentIdx(i => Math.max(0, Math.min(words.length - 1, i + delta)))
  }, [words.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const currentWord = words[currentIdx]
  if (!currentWord) return null

  const answered = answers[currentWord.wid]
  const isCorrect = answered === currentWord.type
  const options = optionsMap[currentWord.wid] ?? []

  function select(type: string) {
    if (answered) return
    setAnswers(prev => ({ ...prev, [currentWord.wid]: type }))
  }

  const answeredCount = Object.keys(answers).length
  const correctCount = Object.entries(answers).filter(([wid, t]) => {
    const w = words.find(w => w.wid === Number(wid))
    return w && w.type === t
  }).length

  return (
    <div>

      {/* Interactive sentence */}
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: '1.25rem',
        lineHeight: 2.1,
        marginBottom: 28,
        color: '#1B3A5C',
        userSelect: 'none',
      }}>
        {words.map((w, i) => {
          const isCurrent = i === currentIdx
          const ans = answers[w.wid]
          const wordCorrect = ans === w.type

          let bg = 'transparent'
          let color = '#1B3A5C'
          let boxShadow = 'none'
          let borderBottom = '2px solid transparent'

          if (isCurrent) {
            bg = '#1B3A5C'
            color = 'white'
            boxShadow = '0 2px 6px rgba(27,58,92,0.25)'
          } else if (ans) {
            borderBottom = `2px solid ${wordCorrect ? '#27ae60' : '#e74c3c'}`
          }

          return (
            <span key={w.wid}>
              <span
                onClick={() => setCurrentIdx(i)}
                title={ans ? (wordCorrect ? '✓ Correct' : `✗ ${w.type}`) : w.word}
                style={{
                  display: 'inline-block',
                  cursor: 'pointer',
                  borderRadius: 5,
                  padding: '0 4px',
                  background: bg,
                  color,
                  boxShadow,
                  borderBottom,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {w.word}
              </span>
              {i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
        <span>.</span>
      </div>

      {/* Score line — once any word is answered */}
      {answeredCount > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#AAA', marginBottom: 16, letterSpacing: '0.04em' }}>
          {correctCount} correct · {answeredCount - correctCount} wrong · {words.length - answeredCount} remaining
        </div>
      )}

      {/* Question card */}
      <div style={{
        border: '1px solid #E8E4DC',
        borderRadius: 10,
        padding: '20px 22px',
        marginBottom: 24,
        background: 'white',
      }}>

        <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: 14 }}>
          What type of word is{' '}
          <span style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            color: '#1B3A5C',
            fontSize: '1rem',
          }}>
            {currentWord.word}
          </span>
          ?
        </div>

        {/* Options — 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {options.map(type => {
            const c = BADGE_COLORS[type] ?? { bg: '#EEE', color: '#333' }
            const isSelected = type === answered
            const isCorrectOption = type === currentWord.type
            const faded = !!answered && !isSelected && !isCorrectOption

            let bg = c.bg
            let color = c.color
            let border = `1.5px solid ${c.color}40`

            if (answered) {
              if (isCorrectOption) {
                bg = '#D4EDDA'; color = '#155724'; border = '1.5px solid #27ae60'
              } else if (isSelected) {
                bg = '#F8D7DA'; color = '#721C24'; border = '1.5px solid #e74c3c'
              }
            }

            return (
              <button
                key={type}
                onClick={() => select(type)}
                disabled={!!answered}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border,
                  background: bg,
                  color,
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: answered ? 'default' : 'pointer',
                  textAlign: 'left',
                  opacity: faded ? 0.3 : 1,
                  transition: 'opacity 0.2s, background 0.15s',
                }}
              >
                {type}
              </button>
            )
          })}
        </div>

        {/* Reveal */}
        {answered && (
          <div style={{
            borderTop: '1px solid #E8E4DC',
            marginTop: 18,
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>{isCorrect ? '✓' : '✗'}</span>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isCorrect ? '#155724' : '#721C24',
              }}>
                {isCorrect ? 'Correct' : `It's a ${currentWord.type}`}
              </span>
            </div>

            {currentWord.job && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.55 }}>
                {currentWord.job}
              </p>
            )}

            {/* Keyboard hint */}
            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#BBB' }}>
              Press → or click Next to continue
            </p>

            {/* Future: chain questions expand here as additional rows */}
          </div>
        )}
      </div>

      {/* Navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Prev / counter / Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            disabled={currentIdx === 0}
            style={navBtn(currentIdx === 0)}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.72rem', color: '#AAA', minWidth: 52, textAlign: 'center' }}>
            {currentIdx + 1} / {words.length}
          </span>
          <button
            onClick={() => navigate(1)}
            disabled={currentIdx === words.length - 1}
            style={navBtn(currentIdx === words.length - 1)}
          >
            Next →
          </button>
        </div>

        {/* New sentence */}
        {onNextSentence && (
          <button
            onClick={onNextSentence}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: '1px solid #1B3A5C',
              background: 'white',
              color: '#1B3A5C',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}
          >
            New sentence →
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {words.map((w, i) => {
          const ans = answers[w.wid]
          const wordCorrect = ans === w.type
          let bg = '#E0DDD8'
          if (i === currentIdx) bg = '#1B3A5C'
          else if (ans) bg = wordCorrect ? '#27ae60' : '#e74c3c'
          return (
            <button
              key={w.wid}
              onClick={() => setCurrentIdx(i)}
              title={w.word}
              style={{
                width: i === currentIdx ? 10 : 8,
                height: i === currentIdx ? 10 : 8,
                borderRadius: '50%',
                background: bg,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'background 0.2s, width 0.15s, height 0.15s',
              }}
            />
          )
        })}
      </div>

    </div>
  )
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #D8D4CC',
    background: disabled ? '#F5F5F5' : 'white',
    color: disabled ? '#CCCCCC' : '#555555',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.82rem',
    fontWeight: 500,
  }
}
