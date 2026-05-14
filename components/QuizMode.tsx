'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Sentence, WordEntry } from '@/lib/types'
import { BADGE_COLORS } from '@/lib/wordTypes'
import { CHAIN_QUESTIONS, ChainQuestion } from '@/lib/chainQuestions'

type Props = {
  sentence: Sentence
  onNextSentence?: () => void
}

type StepAnswer = {
  selected: string
  movedOn: boolean
}

type WordState = {
  openedChainQs: ChainQuestion[]
  answers: (StepAnswer | null)[]
}

const ALL_TYPES = Object.keys(BADGE_COLORS)
const MAX_CHAIN = 2

function deterministicOptions(correct: string, pool: string[], seed: number): string[] {
  const rng = (n: number) => ((seed * 2654435761 + n * 1234567) >>> 0) / 0xffffffff
  const others = pool
    .filter(t => t !== correct)
    .map((t, i) => ({ t, r: rng(i) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 3)
    .map(x => x.t)
  return [...others, correct]
    .map((t, i) => ({ t, r: rng(i + 100) }))
    .sort((a, b) => a.r - b.r)
    .map(x => x.t)
}

function getCorrectForStep(word: WordEntry, ws: WordState, step: number): string {
  if (step === 0) return word.type
  const q = ws.openedChainQs[step - 1]
  return (word as Record<string, unknown>)[q.field] as string ?? ''
}

function getRationaleForStep(word: WordEntry, ws: WordState, step: number): string {
  const key = step === 0 ? 'type' : ws.openedChainQs[step - 1].id
  return word.rationale?.[key] ?? (step === 0 ? word.job : '')
}

function getPromptForStep(word: WordEntry, ws: WordState, step: number): string {
  if (step === 0) return `What type of word is "${word.word}"?`
  return ws.openedChainQs[step - 1].prompt
}

function getOptionsForStep(word: WordEntry, ws: WordState, step: number, seed: number): string[] {
  if (step === 0) return deterministicOptions(word.type, ALL_TYPES, seed)
  return ws.openedChainQs[step - 1].options
}

function getNextAvailableQ(word: WordEntry, ws: WordState, usedIds: Set<string>): ChainQuestion | null {
  if (ws.openedChainQs.length >= MAX_CHAIN) return null
  const openedIds = new Set(ws.openedChainQs.map(q => q.id))
  const candidates = CHAIN_QUESTIONS[word.type] ?? []
  return candidates.find(q => {
    const val = (word as Record<string, unknown>)[q.field]
    return val != null && val !== '' && !usedIds.has(q.id) && !openedIds.has(q.id)
  }) ?? null
}

export default function QuizMode({ sentence, onNextSentence }: Props) {
  const { words } = sentence.breakdown
  const [currentIdx, setCurrentIdx] = useState(0)
  const [wordStates, setWordStates] = useState<Record<number, WordState>>({})
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCurrentIdx(0)
    setWordStates({})
    setUsedQuestionIds(new Set())
  }, [sentence.id])

  const navigate = useCallback((delta: number) => {
    setCurrentIdx(i => Math.max(0, Math.min(words.length - 1, i + delta)))
  }, [words.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const currentWord = words[currentIdx]
  if (!currentWord) return null

  const ws: WordState = wordStates[currentWord.wid] ?? { openedChainQs: [], answers: [null] }
  const activeStep = ws.openedChainQs.length

  function setWs(wid: number, update: (prev: WordState) => WordState) {
    setWordStates(prev => {
      const current = prev[wid] ?? { openedChainQs: [], answers: [null] }
      return { ...prev, [wid]: update(current) }
    })
  }

  function handleSelect(selected: string) {
    setWs(currentWord.wid, prev => {
      const newAnswers = [...prev.answers]
      newAnswers[activeStep] = { selected, movedOn: false }
      return { ...prev, answers: newAnswers }
    })
  }

  function handleTryAgain() {
    setWs(currentWord.wid, prev => {
      const newAnswers = [...prev.answers]
      newAnswers[activeStep] = null
      return { ...prev, answers: newAnswers }
    })
  }

  function handleMoveOn() {
    setWs(currentWord.wid, prev => {
      const newAnswers = [...prev.answers]
      if (newAnswers[activeStep]) {
        newAnswers[activeStep] = { ...newAnswers[activeStep]!, movedOn: true }
      }
      return { ...prev, answers: newAnswers }
    })
  }

  function handleOpenNext(nextQ: ChainQuestion) {
    setUsedQuestionIds(prev => new Set([...prev, nextQ.id]))
    setWs(currentWord.wid, prev => ({
      ...prev,
      openedChainQs: [...prev.openedChainQs, nextQ],
      answers: [...prev.answers, null],
    }))
  }

  const nextQ = getNextAvailableQ(currentWord, ws, usedQuestionIds)
  const activeAnswer = ws.answers[activeStep]
  const activeCorrect = getCorrectForStep(currentWord, ws, activeStep)
  const activeIsCorrect = activeAnswer !== null && activeAnswer.selected === activeCorrect
  const canOpenNext = activeAnswer !== null &&
    (activeIsCorrect || activeAnswer.movedOn) &&
    nextQ !== null

  const { correctCount, totalAnswered } = useMemo(() => {
    let correct = 0, total = 0
    words.forEach(w => {
      const state = wordStates[w.wid]
      if (!state) return
      state.answers.forEach((ans, step) => {
        if (!ans) return
        total++
        if (ans.selected === getCorrectForStep(w, state, step)) correct++
      })
    })
    return { correctCount: correct, totalAnswered: total }
  }, [wordStates, words])

  return (
    <div>

      {/* Interactive sentence */}
      <div style={{
        fontFamily: 'Georgia, serif', fontSize: '1.25rem', lineHeight: 2.1,
        marginBottom: 28, color: '#1B3A5C', userSelect: 'none',
      }}>
        {words.map((w, i) => {
          const state = wordStates[w.wid]
          const firstAns = state?.answers[0]
          const isRight = firstAns && firstAns.selected === w.type
          const isCurrent = i === currentIdx

          let bg = 'transparent', color = '#1B3A5C', borderBottom = '2px solid transparent', boxShadow = 'none'
          if (isCurrent) { bg = '#1B3A5C'; color = 'white'; boxShadow = '0 2px 6px rgba(27,58,92,0.25)' }
          else if (firstAns) { borderBottom = `2px solid ${isRight ? '#27ae60' : '#e74c3c'}` }

          return (
            <span key={w.wid}>
              <span
                onClick={() => setCurrentIdx(i)}
                title={w.word}
                style={{
                  display: 'inline-block', cursor: 'pointer', borderRadius: 5, padding: '0 4px',
                  background: bg, color, boxShadow, borderBottom,
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

      {/* Score line */}
      {totalAnswered > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#AAA', marginBottom: 16, letterSpacing: '0.04em' }}>
          {correctCount} correct · {totalAnswered - correctCount} wrong · {words.length - Object.keys(wordStates).length} untouched
        </div>
      )}

      {/* Question stack for current word */}
      <div style={{ marginBottom: 24 }}>

        {/* Collapsed answered steps */}
        {Array.from({ length: activeStep }, (_, step) => {
          const ans = ws.answers[step]
          if (!ans) return null
          const correct = getCorrectForStep(currentWord, ws, step)
          const isRight = ans.selected === correct
          return (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', marginBottom: 8,
              background: '#F8F8F6', borderRadius: 6,
              borderLeft: `3px solid ${isRight ? '#27ae60' : '#e74c3c'}`,
              fontSize: '0.82rem',
            }}>
              <span style={{ fontWeight: 600, color: isRight ? '#27ae60' : '#e74c3c' }}>
                {isRight ? '✓' : '✗'}
              </span>
              <span style={{ color: '#444' }}>{correct}</span>
              {!isRight && (
                <span style={{ fontSize: '0.72rem', color: '#999' }}>
                  · you said: {ans.selected}
                </span>
              )}
            </div>
          )
        })}

        {/* Active question card */}
        <QuestionCard
          prompt={getPromptForStep(currentWord, ws, activeStep)}
          options={getOptionsForStep(currentWord, ws, activeStep, currentIdx)}
          correct={activeCorrect}
          rationale={getRationaleForStep(currentWord, ws, activeStep)}
          answer={activeAnswer}
          onSelect={handleSelect}
          onTryAgain={handleTryAgain}
          onMoveOn={handleMoveOn}
          canOpenNext={canOpenNext}
          nextQPrompt={nextQ?.prompt ?? null}
          onOpenNext={() => nextQ && handleOpenNext(nextQ)}
        />
      </div>

      {/* Navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} disabled={currentIdx === 0} style={navBtn(currentIdx === 0)}>
            ← Prev
          </button>
          <span style={{ fontSize: '0.72rem', color: '#AAA', minWidth: 52, textAlign: 'center' }}>
            {currentIdx + 1} / {words.length}
          </span>
          <button onClick={() => navigate(1)} disabled={currentIdx === words.length - 1} style={navBtn(currentIdx === words.length - 1)}>
            Next →
          </button>
        </div>
        {onNextSentence && (
          <button onClick={onNextSentence} style={{
            padding: '8px 18px', borderRadius: 6, border: '1px solid #1B3A5C',
            background: 'white', color: '#1B3A5C', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 500,
          }}>
            New sentence →
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {words.map((w, i) => {
          const state = wordStates[w.wid]
          const firstAns = state?.answers[0]
          const isRight = firstAns && firstAns.selected === w.type
          let bg = '#E0DDD8'
          if (i === currentIdx) bg = '#1B3A5C'
          else if (firstAns) bg = isRight ? '#27ae60' : '#e74c3c'
          return (
            <button
              key={w.wid}
              onClick={() => setCurrentIdx(i)}
              title={w.word}
              style={{
                width: i === currentIdx ? 10 : 8,
                height: i === currentIdx ? 10 : 8,
                borderRadius: '50%', background: bg, border: 'none',
                padding: 0, cursor: 'pointer',
                transition: 'background 0.2s, width 0.15s, height 0.15s',
              }}
            />
          )
        })}
      </div>

    </div>
  )
}

type QuestionCardProps = {
  prompt: string
  options: string[]
  correct: string
  rationale: string
  answer: StepAnswer | null
  onSelect: (v: string) => void
  onTryAgain: () => void
  onMoveOn: () => void
  canOpenNext: boolean
  nextQPrompt: string | null
  onOpenNext: () => void
}

function QuestionCard({
  prompt, options, correct, rationale, answer,
  onSelect, onTryAgain, onMoveOn, canOpenNext, nextQPrompt, onOpenNext,
}: QuestionCardProps) {
  const isAnswered = answer !== null
  const isCorrect = isAnswered && answer.selected === correct
  const isWrong = isAnswered && !isCorrect
  const showTryAgainMoveOn = isWrong && !answer.movedOn
  const showChainGesture = canOpenNext && (isCorrect || (isWrong && answer.movedOn))

  const cols = options.length <= 2 ? '1fr 1fr' : '1fr 1fr'

  return (
    <div style={{ border: '1px solid #E8E4DC', borderRadius: 10, padding: '20px 22px', background: 'white' }}>

      <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: 14 }}>
        {prompt}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8 }}>
        {options.map(opt => {
          const isSelected = opt === answer?.selected
          const isCorrectOpt = opt === correct
          const faded = isAnswered && !isSelected && !isCorrectOpt

          let bg = '#F8F8F6', color = '#444', border = '1.5px solid #E0DDD8'
          if (isAnswered) {
            if (isCorrectOpt) { bg = '#D4EDDA'; color = '#155724'; border = '1.5px solid #27ae60' }
            else if (isSelected) { bg = '#F8D7DA'; color = '#721C24'; border = '1.5px solid #e74c3c' }
          }

          return (
            <button
              key={opt}
              onClick={() => !isAnswered && onSelect(opt)}
              disabled={isAnswered}
              style={{
                padding: '8px 12px', borderRadius: 6, border, background: bg, color,
                fontSize: '0.78rem', fontWeight: 500,
                cursor: isAnswered ? 'default' : 'pointer',
                textAlign: 'left', opacity: faded ? 0.3 : 1,
                transition: 'opacity 0.2s, background 0.15s',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Reveal */}
      {isAnswered && (
        <div style={{ borderTop: '1px solid #E8E4DC', marginTop: 16, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{isCorrect ? '✓' : '✗'}</span>
            <div>
              <div style={{
                fontSize: '0.82rem', fontWeight: 600,
                color: isCorrect ? '#155724' : '#721C24',
                marginBottom: rationale ? 4 : 0,
              }}>
                {isCorrect ? 'Correct' : `It's ${correct}`}
              </div>
              {rationale && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.55 }}>
                  {rationale}
                </p>
              )}
            </div>
          </div>

          {showTryAgainMoveOn && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onTryAgain} style={actionBtn('secondary')}>Try again</button>
              <button onClick={onMoveOn} style={actionBtn('primary')}>Move on</button>
            </div>
          )}

          {showChainGesture && nextQPrompt && (
            <button
              onClick={onOpenNext}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: '#F5F3EF', border: '1px dashed #C8C4BC', borderRadius: 6,
                cursor: 'pointer', fontSize: '0.78rem', color: '#666',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: showTryAgainMoveOn ? 0 : 0,
              }}
            >
              <span>{nextQPrompt}</span>
              <span style={{ fontSize: '0.7rem', color: '#AAA' }}>▼</span>
            </button>
          )}

          {isCorrect && !canOpenNext && (
            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#BBB' }}>
              Press → or click Next to continue
            </p>
          )}
        </div>
      )}

    </div>
  )
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 6, border: '1px solid #D8D4CC',
    background: disabled ? '#F5F5F5' : 'white',
    color: disabled ? '#CCCCCC' : '#555555',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.82rem', fontWeight: 500,
  }
}

function actionBtn(variant: 'primary' | 'secondary'): React.CSSProperties {
  return {
    padding: '6px 16px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    border: variant === 'primary' ? '1px solid #1B3A5C' : '1px solid #D8D4CC',
    background: variant === 'primary' ? '#1B3A5C' : 'white',
    color: variant === 'primary' ? 'white' : '#666',
  }
}
