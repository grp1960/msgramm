'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sentence } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Breakdown from './Breakdown'
import ChatPanel from './ChatPanel'
import AuthModal from './AuthModal'
import FeedbackModal, { FeedbackScope } from './FeedbackModal'

export default function SentencePage({ sentence, isNew }: { sentence: Sentence; isNew?: boolean }) {
  const [user, setUser] = useState<User | null>(null)
  const [saved, setSaved] = useState(false)
  const [userTags, setUserTags] = useState<string[]>([])
  const [showAuth, setShowAuth] = useState(false)
  const [feedbackScope, setFeedbackScope] = useState<FeedbackScope | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setSaved(false); setUserTags([]); return }
    supabase
      .from('saved_sentences')
      .select('user_tags')
      .eq('user_id', user.id)
      .eq('sentence_id', sentence.id)
      .single()
      .then(({ data }) => {
        if (data) { setSaved(true); setUserTags(data.user_tags ?? []) }
        else { setSaved(false); setUserTags([]) }
      })
  }, [user, sentence.id])

  async function handleSave() {
    if (!user || saved) return
    await supabase.from('saved_sentences').insert({ user_id: user.id, sentence_id: sentence.id, user_tags: [] })
    setSaved(true)
  }

  async function updateUserTags(tags: string[]) {
    await supabase
      .from('saved_sentences')
      .update({ user_tags: tags })
      .eq('user_id', user!.id)
      .eq('sentence_id', sentence.id)
    setUserTags(tags)
  }

  const wordCount = sentence.breakdown.words.length

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {feedbackScope && (
        <FeedbackModal
          scope={feedbackScope}
          sentenceId={feedbackScope === 'sentence' ? sentence.id : undefined}
          userId={user?.id}
          userEmail={user?.email}
          onClose={() => setFeedbackScope(null)}
        />
      )}

      <div className="mg-shell">
        <header className="mg-header">
          <Link href="/" className="mg-wordmark">
            Ms<span className="dot" />Gramm
          </Link>

          <div className="mg-header-meta">
            <span>{sentence.language}</span>
            <span>{wordCount}&nbsp;words</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={monoNavLink}>← Sentences</Link>
            <Link href="/topics" style={monoNavLink}>Topics</Link>
            <button onClick={() => setFeedbackScope('general')} style={{ ...monoNavLink, background: 'transparent', border: 0, cursor: 'pointer' }}>
              Feedback
            </button>
            {user ? (
              <button onClick={() => supabase.auth.signOut()} style={{ ...monoNavLink, background: 'transparent', border: 0, cursor: 'pointer' }}>
                Sign out
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ ...monoNavLink, background: 'transparent', border: 0, cursor: 'pointer' }}>
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* ── Save prompt for freshly submitted sentences ── */}
        {isNew && !saved && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', marginBottom: 32,
            background: 'var(--bone-d)', borderLeft: '2px solid var(--ink)',
            flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-70)' }}>
              Want to keep this breakdown?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {user ? (
                <button
                  onClick={handleSave}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
                    textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--bone)',
                    border: 0, padding: '8px 16px', cursor: 'pointer',
                  }}
                >
                  Save it
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
                    textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--bone)',
                    border: 0, padding: '8px 16px', cursor: 'pointer',
                  }}
                >
                  Sign in to save
                </button>
              )}
            </div>
          </div>
        )}

        {isNew && saved && (
          <div style={{
            padding: '14px 20px', marginBottom: 32,
            background: 'var(--bone-d)', borderLeft: '2px solid var(--ink)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-60)' }}>
              ✓ Saved to your collection
            </span>
          </div>
        )}

        <Breakdown
          sentence={sentence}
          saved={saved}
          onSave={user ? handleSave : undefined}
          userTags={saved ? userTags : undefined}
          onUserTagsChange={saved ? updateUserTags : undefined}
          onFeedback={() => setFeedbackScope('sentence')}
        />
      </div>

      <ChatPanel sentence={sentence} userId={user?.id} />
    </>
  )
}

const monoNavLink: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-60)',
  textDecoration: 'none',
}
