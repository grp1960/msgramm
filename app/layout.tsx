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
        <header
          className="flex items-baseline gap-3 px-6 py-4"
          style={{ background: '#1B3A5C' }}
        >
          <h1
            className="text-2xl text-white"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}
          >
            Ms. Gramm
          </h1>
          <span className="text-xs text-white opacity-50 tracking-widest uppercase">
            Sentence Breakdown
          </span>
        </header>
        {children}
      </body>
    </html>
  )
}
