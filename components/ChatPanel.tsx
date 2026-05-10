'use client'

import { useState, useRef, useEffect } from 'react'
import { Sentence } from '@/lib/types'

type Message = { role: 'user' | 'assistant'; content: string }

type Props = {
  sentence: Sentence
  userId?: string
}

export default function ChatPanel({ sentence, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Reset conversation when sentence changes
  useEffect(() => {
    setMessages([])
    setTotalTokens(0)
  }, [sentence.id])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, sentence, userId }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.content }])
      setTotalTokens(t => t + (data.usage?.total_tokens ?? 0))
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed',
          right: open ? 340 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#1B3A5C',
          color: 'white',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '14px 8px',
          cursor: 'pointer',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 200,
          transition: 'right 0.25s ease',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {open ? '✕ Close' : 'Ask'}
      </button>

      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: open ? 0 : -340,
        top: 48,
        width: 340,
        height: 'calc(100vh - 48px)',
        background: 'white',
        borderLeft: '1px solid #E8E4DC',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 199,
        transition: 'right 0.25s ease',
        boxShadow: open ? '-4px 0 20px rgba(0,0,0,0.08)' : 'none',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #E8E4DC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontWeight: 600, fontSize: '0.95rem' }}>
            Ask Ms. Gramm
          </span>
          {totalTokens > 0 && (
            <span style={{ fontSize: '0.65rem', color: '#BBB', fontFamily: 'monospace' }}>
              {totalTokens.toLocaleString()} tokens
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {messages.length === 0 && (
            <p style={{
              fontSize: '0.8rem', color: '#BBB', fontStyle: 'italic',
              textAlign: 'center', marginTop: 48, lineHeight: 1.6,
            }}>
              Ask anything about this sentence — grammar, vocabulary, usage.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '9px 13px',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? '#1B3A5C' : '#F0F4F8',
              color: m.role === 'user' ? 'white' : '#333',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '9px 13px',
              borderRadius: '12px 12px 12px 2px',
              background: '#F0F4F8',
              color: '#AAA',
              fontSize: '1rem',
              letterSpacing: '0.15em',
            }}>
              ···
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid #E8E4DC',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about this sentence…"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #D8D4CC',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: loading || !input.trim() ? '#CCC' : '#1B3A5C',
              color: 'white',
              fontSize: '0.85rem',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              fontWeight: 500,
            }}
          >
            Send
          </button>
        </div>

      </div>
    </>
  )
}
