'use client'

import { useState } from 'react'
import { WordEntry as WordEntryType } from '@/lib/types'
import { BADGE_COLORS } from '@/lib/wordTypes'
import Tooltip from './Tooltip'

const ALL_TYPES = Object.keys(BADGE_COLORS)

type Props = {
  entry: WordEntryType
  highlighted: boolean
  quizMode: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export default function WordEntry({ entry, highlighted, quizMode, onMouseEnter, onMouseLeave }: Props) {
  const colors = BADGE_COLORS[entry.type] ?? { bg: '#EEE', color: '#333' }

  return (
    <div
      className="rounded-lg p-3 border transition-colors"
      style={{
        background: highlighted ? '#F0F4F8' : 'white',
        borderColor: highlighted ? '#2E6DA4' : '#E8E4DC',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-xs text-gray-400 font-mono">{entry.wid}.</span>
        <span className="font-semibold text-base" style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C' }}>
          {entry.word}
        </span>
        <Tooltip type={entry.type} bg={colors.bg} color={colors.color}>
          {entry.type}
        </Tooltip>
      </div>

      {!quizMode && (
        <>
          {entry.form && (
            <div
              className="text-xs text-gray-500 mt-1"
              dangerouslySetInnerHTML={{ __html: italicise(entry.form) }}
            />
          )}
          {entry.note && (
            <div
              className="text-xs text-gray-600 mt-1 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: italicise(entry.note) }}
            />
          )}
          <div className="text-xs font-medium mt-1.5" style={{ color: '#1B3A5C' }}>
            {entry.job}
          </div>
        </>
      )}

      {quizMode && <QuizChips entry={entry} />}
    </div>
  )
}

function italicise(text: string) {
  return text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function getQuizOptions(correct: string): string[] {
  const pool = ALL_TYPES.filter(t => t !== correct)
  const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3)
  return [...distractors, correct].sort(() => Math.random() - 0.5)
}

function QuizChips({ entry }: { entry: WordEntryType }) {
  const [answered, setAnswered] = useState<string | null>(null)
  const options = getQuizOptions(entry.type)

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {options.map(type => {
        const colors = BADGE_COLORS[type] ?? { bg: '#EEE', color: '#333' }
        const isCorrect = type === entry.type
        const isSelected = type === answered
        let style: React.CSSProperties = { background: colors.bg, color: colors.color }
        if (answered) {
          if (isCorrect) style = { background: '#D4EDDA', color: '#155724', fontWeight: 600 }
          else if (isSelected) style = { background: '#F8D7DA', color: '#721C24' }
          else style = { ...style, opacity: 0.4 }
        }
        return (
          <button
            key={type}
            disabled={!!answered}
            onClick={() => setAnswered(type)}
            className="px-2 py-0.5 rounded text-xs transition-all"
            style={style}
          >
            {type}
          </button>
        )
      })}
    </div>
  )
}
