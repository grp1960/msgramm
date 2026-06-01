'use client'

import Link from 'next/link'
import { WordEntry as WordEntryType } from '@/lib/types'

const PROP_FIELDS = ['case', 'gender', 'number', 'tense', 'person'] as const
type PropField = typeof PROP_FIELDS[number]

type Props = {
  entry: WordEntryType
  mode: 'study' | 'quiz'
  isHovered: boolean
  isActive: boolean
  revealed: Record<string, boolean>
  topicSlug?: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onReveal: (key: string) => void
  onRevealAll: () => void
}

export default function WordEntry({
  entry, mode, isHovered, isActive, revealed, topicSlug,
  onMouseEnter, onMouseLeave, onReveal, onRevealAll,
}: Props) {
  const props = PROP_FIELDS
    .filter((k): k is PropField => entry[k] != null && entry[k] !== '')
    .map(k => [k, entry[k] as string] as [string, string])

  const roleKey = `${entry.wid}.role`
  const roleRevealed = revealed[roleKey]
  const allRevealed = (mode === 'study') ||
    (roleRevealed && props.every(([k]) => revealed[`${entry.wid}.${k}`]))

  return (
    <div
      className="mg-entry"
      data-active={isActive ? 'true' : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Number + POS */}
      <div className="mg-entry-lead">
        <div className="mg-entry-num">
          {String(entry.wid).padStart(2, '0')}
          <span className="pos">{entry.type}</span>
        </div>

        {/* Headline: word + gloss */}
        <div className="mg-entry-headline">
          <p className="mg-entry-word">{entry.word}</p>
          {entry.translation && (
            <p className="mg-entry-gloss">&ldquo;{entry.translation}&rdquo;</p>
          )}
        </div>

        {/* Lemma */}
        {entry.form && (
          <div className="mg-entry-lemma">
            <span className="lem-key">Lemma</span>
            {entry.form}
          </div>
        )}
      </div>

      {/* Property strip */}
      {props.length > 0 && (
        <div className="mg-props">
          {props.map(([k, v]) => {
            const propKey = `${entry.wid}.${k}`
            const isRevealed = mode === 'study' || revealed[propKey]
            return (
              <div key={k} className="mg-prop">
                <span className="mg-prop-key">{k}</span>
                {isRevealed ? (
                  <span className="mg-prop-value">{v}</span>
                ) : (
                  <button
                    className="mg-prop-value quiz"
                    onClick={() => onReveal(propKey)}
                    aria-label={`Reveal ${k}`}
                  >
                    ?
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Role */}
      {entry.job && (
        <p className="mg-role">
          {mode === 'quiz' && !roleRevealed ? (
            <button
              className="mg-role-cover"
              onClick={() => onReveal(roleKey)}
            >
              What&rsquo;s it doing in this sentence? &darr;
            </button>
          ) : (
            entry.job
          )}
        </p>
      )}

      {/* Note */}
      {entry.note && mode === 'study' && (
        <p className="mg-note">{entry.note}</p>
      )}

      {/* Learn more */}
      {topicSlug && mode === 'study' && (
        <Link href={`/topics/${topicSlug}`} className="mg-learn">
          Learn more
        </Link>
      )}

      {/* Quiz: reveal all */}
      {mode === 'quiz' && !allRevealed && (
        <button className="mg-quiz-reveal-all" onClick={onRevealAll}>
          Reveal all &rarr;
        </button>
      )}
    </div>
  )
}
