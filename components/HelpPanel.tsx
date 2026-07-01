'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface HelpTopic {
  id: string
  title: string
  description: string | null
  url: string | null
  sort_order: number
}

export default function HelpPanel() {
  const [open, setOpen] = useState(false)
  const [topics, setTopics] = useState<HelpTopic[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('help_topics')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setTopics(data as HelpTopic[]) })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-60)',
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
        }}
      >
        Help
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          background: 'var(--bone)', border: 'var(--border-hair)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          width: 320, zIndex: 500,
        }}>
          <div style={{ padding: '16px 24px 12px', borderBottom: 'var(--border-rule)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)', margin: 0 }}>
              How-to videos
            </p>
          </div>

          {topics.length === 0 ? (
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-40)', padding: '16px 24px', margin: 0 }}>
              Videos coming soon.
            </p>
          ) : (
            <div>
              {topics.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    padding: '14px 24px',
                    borderBottom: i < topics.length - 1 ? 'var(--border-rule)' : 'none',
                  }}
                >
                  {t.url ? (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <p style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--gold)', margin: '0 0 3px' }}>
                        {t.title} ↗
                      </p>
                      {t.description && (
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-60)', margin: 0, lineHeight: 1.4 }}>
                          {t.description}
                        </p>
                      )}
                    </a>
                  ) : (
                    <>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink-40)', margin: '0 0 3px' }}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-40)', margin: 0, lineHeight: 1.4 }}>
                          {t.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
