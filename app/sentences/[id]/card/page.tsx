import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Sentence } from '@/lib/types'
import { BADGE_COLORS, HIGHLIGHT_COLORS } from '@/lib/wordTypes'

async function getSentence(id: string): Promise<Sentence | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const { data } = await supabase.from('sentences').select('*').eq('id', id).single()
  return data as Sentence | null
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sentence = await getSentence(id)
  if (!sentence) notFound()

  const { words, translation } = sentence.breakdown
  const capped = words.slice(0, 12)
  const skipped = words.length - capped.length

  return (
    <div style={{
      width: 1080,
      height: 1080,
      background: '#F5F3EF',
      fontFamily: 'var(--sans)',
      display: 'flex',
      flexDirection: 'column',
      padding: '64px 72px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* Wordmark */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, letterSpacing: '0.08em', color: '#1E1E2E', marginBottom: 48 }}>
        Ms<span style={{ color: '#E8742A' }}>.</span>Gramm
      </div>

      {/* Sentence */}
      <div style={{
        fontFamily: 'var(--display)',
        fontSize: 28,
        fontWeight: 300,
        lineHeight: 1.45,
        letterSpacing: '-0.01em',
        color: '#1E1E2E',
        marginBottom: 14,
      }}>
        {sentence.text}
      </div>

      {/* Translation */}
      <div style={{
        fontFamily: 'var(--display)',
        fontStyle: 'italic',
        fontSize: 16,
        color: '#6B6B7E',
        marginBottom: 48,
        lineHeight: 1.4,
      }}>
        &ldquo;{translation}&rdquo;
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#DDDDD8', marginBottom: 40 }} />

      {/* Word cards grid — 3 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px 24px',
        flex: 1,
        alignContent: 'start',
      }}>
        {capped.map(w => {
          const colors = BADGE_COLORS[w.type] ?? { bg: '#F0F0F0', color: '#666' }
          const accent = (HIGHLIGHT_COLORS[w.type] ?? { bg: '#CCCCCC' }).bg
          const props = (['case', 'gender', 'number', 'tense', 'person'] as const)
            .filter(k => w[k])
            .map(k => w[k] as string)
          return (
            <div key={w.wid} style={{
              background: '#FFFFFF',
              border: '1px solid #E8E8E4',
              borderLeft: `4px solid ${accent}`,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              {/* Word number + type badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#AAAAAA', letterSpacing: '0.06em' }}>
                  {String(w.wid).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: colors.bg,
                  color: colors.color,
                  padding: '2px 6px',
                }}>
                  {w.type}
                </span>
              </div>
              {/* Word */}
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 300, color: '#1E1E2E', lineHeight: 1.2 }}>
                {w.word}
              </div>
              {/* Translation */}
              {w.translation && (
                <div style={{ fontFamily: 'var(--display)', fontStyle: 'italic', fontSize: 12, color: '#6B6B7E' }}>
                  {w.translation}
                </div>
              )}
              {/* Props */}
              {props.length > 0 && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#AAAAAA', letterSpacing: '0.04em', marginTop: 2 }}>
                  {props.join(' · ')}
                </div>
              )}
              {/* Job */}
              {w.job && (
                <div style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 11,
                  color: '#8A8A9A',
                  lineHeight: 1.4,
                  marginTop: 2,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {w.job}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Skipped words note */}
      {skipped > 0 && (
        <div style={{
          marginTop: 12,
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: '#AAAAAA',
        }}>
          + {skipped} more word{skipped !== 1 ? 's' : ''} — full breakdown at msgramm.com
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 32,
        fontFamily: 'var(--mono)',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#AAAAAA',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{sentence.language} · {sentence.difficulty}</span>
        <span>msgramm.com</span>
      </div>

    </div>
  )
}
