'use client'

import { useState, useRef, useEffect } from 'react'
import { Sentence } from '@/lib/types'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Why is the verb split across the sentence?',
  'What case is Schwester in, and why?',
  'How do I know which article to use here?',
  'What\'s the difference between am and im?',
]

type Props = {
  sentence: Sentence
  userId?: string
}

export default function ChatPanel({ sentence, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    setMessages([])
  }, [sentence.id])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 280)
      return () => clearTimeout(t)
    }
  }, [open])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, sentence, userId }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.content }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        className="mg-ask-launcher"
        onClick={() => setOpen(true)}
        style={{ display: open ? 'none' : 'flex' }}
      >
        <span className="dot" />
        Ask Ms. Gramm
      </button>

      {/* Drawer */}
      <div className={`mg-ask-drawer${open ? ' is-open' : ''}`}>
        <div className="mg-ask-header">
          <span className="mg-ask-title">
            <span className="dot" />
            Ask Ms. Gramm
          </span>
          <button className="mg-ask-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>

        <div className="mg-ask-context">
          <span className="lbl">About this sentence</span>
          {sentence.text}
        </div>

        <div className="mg-ask-thread">
          {messages.length === 0 ? (
            <>
              <p className="mg-ask-empty">
                Ask anything about this sentence — grammar, vocabulary, usage.
              </p>
              <div className="mg-suggestions">
                {SUGGESTIONS.map(q => (
                  <button key={q} className="mg-suggestion" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`mg-message ${m.role}`}>
                  <div className="msg-role">{m.role === 'user' ? 'You' : 'Ms. Gramm'}</div>
                  <div className="msg-body">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="mg-message assistant">
                  <div className="msg-role">Ms. Gramm</div>
                  <div className="mg-thinking">thinking…</div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mg-ask-input">
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            placeholder="Ask about this sentence…"
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
          <button
            className="mg-ask-send"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
