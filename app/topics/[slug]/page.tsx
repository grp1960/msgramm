import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Topic } from '@/lib/types'
import TopicRenderer from '@/components/TopicRenderer'

export const revalidate = 60

async function getTopic(slug: string): Promise<Topic | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const { data } = await supabase.from('topics').select('*').eq('slug', slug).single()
  return data as Topic | null
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = await getTopic(slug)
  if (!topic) notFound()

  return (
    <main style={{ maxWidth: 720, padding: '48px 48px' }}>
      <Link href="/topics" style={{ fontSize: '0.8rem', color: '#888', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Topics
      </Link>
      <h1 style={{ fontFamily: 'Georgia, serif', color: '#1B3A5C', fontSize: '1.8rem', fontWeight: 600, marginBottom: 32, lineHeight: 1.3 }}>
        {topic.title}
      </h1>
      <TopicRenderer blocks={topic.body.blocks} />
    </main>
  )
}
