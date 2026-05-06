'use client'

import { useEffect, useRef, useState } from 'react'
import { GLOSSARY } from '@/lib/wordTypes'

type Props = { type: string; children: React.ReactNode; bg: string; color: string }

export default function Tooltip({ type, children, bg, color }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const show = () => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX })
    setVisible(true)
  }

  useEffect(() => {
    const hide = () => setVisible(false)
    document.addEventListener('scroll', hide, true)
    return () => document.removeEventListener('scroll', hide, true)
  }, [])

  const def = GLOSSARY[type]

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default"
        style={{ background: bg, color }}
      >
        {children}
      </span>
      {visible && def && (
        <div
          className="fixed z-50 max-w-xs rounded-lg shadow-lg p-3 text-sm"
          style={{ top: pos.top, left: pos.left, background: '#1B3A5C', color: 'white' }}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
        >
          <div className="font-semibold mb-1" style={{ fontFamily: 'Georgia, serif' }}>{type}</div>
          <div className="text-xs opacity-90 leading-relaxed">{def}</div>
        </div>
      )}
    </>
  )
}
