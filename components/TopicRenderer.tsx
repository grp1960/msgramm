'use client'

import { TopicBlock } from '@/lib/types'

export default function TopicRenderer({ blocks }: { blocks: TopicBlock[] }) {
  return (
    <div style={{ lineHeight: 1.8, color: '#333' }}>
      {blocks.map((block, i) => {
        if (block.type === 'header') {
          const Tag = `h${block.data.level}` as 'h2' | 'h3'
          const size = block.data.level === 2 ? '1.25rem' : '1.05rem'
          return (
            <Tag key={i} style={{
              fontFamily: 'Georgia, serif', color: '#1B3A5C',
              fontSize: size, fontWeight: 600,
              margin: '28px 0 10px', lineHeight: 1.4,
            }}>
              {block.data.text}
            </Tag>
          )
        }
        if (block.type === 'paragraph') {
          return (
            <p key={i}
              style={{ fontSize: '0.95rem', marginBottom: 14 }}
              dangerouslySetInnerHTML={{ __html: block.data.text }}
            />
          )
        }
        return null
      })}
    </div>
  )
}
