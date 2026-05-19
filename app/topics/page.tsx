import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Topic } from '@/lib/types'

export const revalidate = 60

async function getTopics(): Promise<Topic[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const { data } = await supabase.from('topics').select('*').order('title')
  return (data ?? []) as Topic[]
}

export default async function TopicsPage() {
  const topics = await getTopics()

  return (
    <main style={{ maxWidth: 860, padding: '48px 48px' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1.6rem', fontWeight: 600, marginBottom: 8 }}>
        Topics
      </h1>
      <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 32 }}>
        Grammar reference articles. Follow "Learn more" links from word cards to jump here.
      </p>
      {topics.length === 0 && (
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No topics yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {topics.map(t => (
          <Link key={t.slug} href={`/topics/${t.slug}`} style={{
            display: 'block', padding: '14px 18px', borderRadius: 8,
            border: '1px solid #E8E4DC', textDecoration: 'none',
            background: 'white', transition: 'background 0.12s',
          }}>
            <span style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1rem', fontWeight: 600 }}>
              {t.title}
            </span>
            {t.word_type && (
              <span style={{ marginLeft: 12, fontSize: '0.72rem', color: '#888' }}>
                {t.word_type}
              </span>
            )}
          </Link>
        ))}
      </div>
    </main>
  )
}
