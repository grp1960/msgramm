'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WordEntry as WordEntryType } from '@/lib/types'

type GrammarField = keyof WordEntryType
import { BADGE_COLORS } from '@/lib/wordTypes'
import Tooltip from './Tooltip'


type Props = {
  entry: WordEntryType
  highlighted: boolean
  quizMode: boolean
  topicSlug?: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export default function WordEntry({ entry, highlighted, quizMode, topicSlug, onMouseEnter, onMouseLeave }: Props) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <span className="text-xs text-gray-400 font-mono">{entry.wid}.</span>
        <span className="font-semibold text-base" style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C' }}>
          {entry.word}
        </span>
        {!quizMode && (
          <Tooltip type={entry.type} bg={colors.bg} color={colors.color}>
            {entry.type}
          </Tooltip>
        )}
        {!quizMode && entry.translation && (
          <span style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
            {entry.translation}
          </span>
        )}
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
          <GrammarChips entry={entry} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
            <div className="text-xs font-medium" style={{ color: '#1B3A5C' }}>
              {entry.job}
            </div>
            {topicSlug && (
              <Link href={`/topics/${topicSlug}`} style={{ fontSize: '0.7rem', color: '#4A6FA5', textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 8 }}>
                Learn more →
              </Link>
            )}
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

const GRAMMAR_FIELDS: Partial<Record<string, GrammarField[]>> = {
  'Noun':               ['gender', 'case', 'number'],
  'Pronoun':            ['gender', 'case'],
  'Article':            ['gender', 'case'],
  'Article contraction':['gender', 'case'],
  'Verb':               ['tense', 'person'],
  'Helper verb':        ['tense', 'person'],
  'Possibility verb':   ['person'],
}

function GrammarChips({ entry }: { entry: WordEntryType }) {
  const fields = GRAMMAR_FIELDS[entry.type] ?? []
  const chips = fields.map(f => entry[f] as string | undefined).filter(Boolean)
  if (!chips.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {chips.map(chip => (
        <span key={chip} style={{
          fontSize: '0.65rem', padding: '1px 7px', borderRadius: 20,
          background: '#EEF2F7', color: '#4A6FA5', fontWeight: 500,
        }}>
          {chip}
        </span>
      ))}
    </div>
  )
}

function getQuizOptions(correct: string): string[] {
  const allTypes = Object.keys(BADGE_COLORS)
  const pool = allTypes.filter(t => t !== correct)
  const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3)
  return [...distractors, correct].sort(() => Math.random() - 0.5)
}

function QuizChips({ entry }: { entry: WordEntryType }) {
  const [answered, setAnswered] = useState<string | null>(null)
  const [options] = useState(() => getQuizOptions(entry.type))
  const colors = BADGE_COLORS[entry.type] ?? { bg: '#EEE', color: '#333' }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map(type => {
          const c = BADGE_COLORS[type] ?? { bg: '#EEE', color: '#333' }
          const isCorrect = type === entry.type
          const isSelected = type === answered
          let style: React.CSSProperties = { background: c.bg, color: c.color }
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
      {answered && (
        <div className="mt-2">
          <Tooltip type={entry.type} bg={colors.bg} color={colors.color}>
            {entry.type}
          </Tooltip>
          {entry.job && (
            <div className="text-xs font-medium mt-1" style={{ color: '#1B3A5C' }}>
              {entry.job}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
