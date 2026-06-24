'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sentence } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/authFetch'
import type { User } from '@supabase/supabase-js'
import Breakdown from './Breakdown'
import ChatPanel from './ChatPanel'
import AuthModal from './AuthModal'
import FeedbackModal, { FeedbackScope } from './FeedbackModal'
import { useToast } from './ToastProvider'

export default function SentencePage({ sentence, isNew, isUnsaved }: { sentence: Sentence; isNew?: boolean; isUnsaved?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [saved, setSaved] = useState(false)
  const [unsaved, setUnsaved] = useState(isUnsaved ?? false)
  const [userTags, setUserTags] = useState<string[]>([])
  const [showAuth, setShowAuth] = useState(false)
  const [feedbackScope, setFeedbackScope] = useState<FeedbackScope | null>(null)
  const unsavedRef = useRef(unsaved)

  useEffect(() => {
    const key = 'mg_hover_hint_shown'
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => {
        toast.show('Hover over words for details', 5000)
        localStorage.setItem(key, '1')
      }, 800)
      return () => clearTimeout(t)
    }
  }, [])

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

  useEffect(() => {
    unsavedRef.current = unsaved
  }, [unsaved])

  useEffect(() => {
    if (!isUnsaved) return
    const handler = (e: BeforeUnloadEvent) => {
      if (!unsavedRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isUnsaved])

  async function handleSave() {
    if (!user) { setShowAuth(true); return }
    if (saved) return
    await supabase.from('saved_sentences').insert({ user_id: user.id, sentence_id: sentence.id, user_tags: [] })
    setSaved(true)
    setUnsaved(false)
  }

  async function handleDiscard() {
    setUnsaved(false)
    await authFetch(`/api/sentences/${sentence.id}`, { method: 'DELETE' })
    router.push('/')
  }

  async function handleRemoveFromSaved() {
    if (!user) return
    await supabase
      .from('saved_sentences')
      .delete()
      .eq('user_id', user.id)
      .eq('sentence_id', sentence.id)
    setSaved(false)
    setUserTags([])
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
            <Link href="/?add=1" style={monoNavLink}>+ Add sentence</Link>
<Link href="/topics" style={monoNavLink}>Topics</Link>
            <button onClick={() => setFeedbackScope('general')} style={{ ...monoNavLink, background: 'transparent', border: '1.5px solid #E8742A', color: '#E8742A', padding: '3px 10px', cursor: 'pointer' }}>
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

        {/* ── Back nav ── */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)', textDecoration: 'none' }}>
            ← Sentences
          </Link>
        </div>

        {/* ── Save / Discard for newly created sentences ── */}
        {isNew && (
          <div style={{ marginBottom: 32 }}>
            {saved ? (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-40)' }}>
                ✓ Saved
              </span>
            ) : unsaved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={handleSave}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
                    textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--bone)',
                    border: 0, padding: '10px 20px', cursor: 'pointer',
                  }}
                >
                  {user ? 'Save this breakdown' : 'Sign in to save'}
                </button>
                <button
                  onClick={handleDiscard}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
                    textTransform: 'uppercase', background: 'transparent', color: 'var(--ink-40)',
                    border: 0, padding: '10px 0', cursor: 'pointer',
                  }}
                >
                  Discard
                </button>
              </div>
            ) : (
              <button
                onClick={handleSave}
                style={{
                  fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
                  textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--bone)',
                  border: 0, padding: '10px 20px', cursor: 'pointer',
                }}
              >
                {user ? 'Save this breakdown' : 'Sign in to save'}
              </button>
            )}
          </div>
        )}

        {/* ── Remove from saved (non-new saved sentences) ── */}
        {!isNew && saved && user && (
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={handleRemoveFromSaved}
              style={{
                fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.08em',
                textTransform: 'uppercase', background: 'transparent', color: 'var(--ink-40)',
                border: 0, padding: 0, cursor: 'pointer',
              }}
            >
              Remove from saved
            </button>
          </div>
        )}

        <Breakdown
          sentence={sentence}
          saved={saved}
          onSave={!isNew && !saved && user ? handleSave : isNew && user ? handleSave : undefined}
          userTags={saved ? userTags : undefined}
          onUserTagsChange={saved ? updateUserTags : undefined}
          userId={user?.id ?? null}
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
