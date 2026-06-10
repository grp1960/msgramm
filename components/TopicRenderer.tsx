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
        if (block.type === 'table') {
          return (
            <div key={i} style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.88rem', width: '100%' }}>
                <thead>
                  <tr>
                    {block.data.headers.map((h, j) => (
                      <th key={j} style={{
                        background: '#1B3A5C', color: '#fff',
                        padding: '7px 12px', textAlign: 'left',
                        fontWeight: 600, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.data.rows.map((row, j) => (
                    <tr key={j} style={{ background: j % 2 === 0 ? '#F7F9FB' : '#fff' }}>
                      {row.map((cell, k) => (
                        <td key={k} style={{
                          padding: '6px 12px',
                          borderBottom: '1px solid #E0E6ED',
                          fontWeight: k === 0 ? 600 : 400,
                          color: k === 0 ? '#1B3A5C' : '#333',
                          whiteSpace: 'nowrap',
                        }} dangerouslySetInnerHTML={{ __html: cell }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
