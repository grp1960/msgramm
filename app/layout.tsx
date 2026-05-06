import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ms. Gramm',
  description: 'Sentence Breakdown',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#F7F5F0', minHeight: '100vh' }}>
        <header style={{ background: '#1B3A5C', padding: '16px 48px', display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.05em' }}>
            Ms. Gramm
          </h1>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Sentence Breakdown
          </span>
        </header>
        {children}
      </body>
    </html>
  )
}
