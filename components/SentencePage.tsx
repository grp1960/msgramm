'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sentence } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Breakdown from './Breakdown'
import ChatPanel from './ChatPanel'
import AuthModal from './AuthModal'

export default function SentencePage({ sentence }: { sentence: Sentence }) {
  const [user, setUser] = useState<User | null>(null)
  const [saved, setSaved] = useState(false)
  const [userTags, setUserTags] = useState<string[]>([])
  const [showAuth, setShowAuth] = useState(false) // for Sign in button

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
        if (data) {
          setSaved(true)
          setUserTags(data.user_tags ?? [])
        } else {
          setSaved(false)
          setUserTags([])
        }
      })
  }, [user, sentence.id])

  async function updateUserTags(tags: string[]) {
    await supabase
      .from('saved_sentences')
      .update({ user_tags: tags })
      .eq('user_id', user!.id)
      .eq('sentence_id', sentence.id)
    setUserTags(tags)
  }

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <nav style={{
        background: '#16324F', padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 48,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', color: 'white', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em' }}>
          Ms. Gramm
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={navBtn}>← Sentences</Link>
          <Link href="/topics" style={navBtn}>Topics</Link>
          {user ? (
            <button onClick={() => supabase.auth.signOut()} style={navBtn}>Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ ...navBtn, borderColor: 'rgba(255,255,255,0.6)', color: 'white' }}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 860, padding: '40px 48px' }}>
        <Breakdown
          sentence={sentence}
          userTags={saved ? userTags : undefined}
          onUserTagsChange={saved ? updateUserTags : undefined}
        />
        <ChatPanel sentence={sentence} userId={user?.id} />
      </main>
    </>
  )
}

const navBtn: React.CSSProperties = {
  fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
  padding: '4px 14px', cursor: 'pointer', textDecoration: 'none',
}
