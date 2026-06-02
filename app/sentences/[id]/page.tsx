import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Sentence } from '@/lib/types'
import SentencePage from '@/components/SentencePage'

async function getSentence(id: string): Promise<Sentence | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const { data } = await supabase.from('sentences').select('*').eq('id', id).single()
  return data as Sentence | null
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string }>
}) {
  const { id } = await params
  const { new: isNew } = await searchParams
  const sentence = await getSentence(id)
  if (!sentence) notFound()

  return <SentencePage sentence={sentence} isNew={isNew === '1'} />
}
