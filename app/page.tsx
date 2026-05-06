import BreakdownPage from '@/components/BreakdownPage'
import { createClient } from '@supabase/supabase-js'
import { seedSentence } from '@/lib/seed'
import { Sentence } from '@/lib/types'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default async function Home() {
  const { data } = await supabaseServer
    .from('sentences')
    .select('*')
    .eq('language', 'de')
    .not('breakdown->translation', 'is', null)
    .limit(1)
    .single()

  if (data) {
    return <BreakdownPage initial={data as Sentence} />
  }

  // No sentence with translation — upsert the seed and use it
  const { text, language, ctx_before, ctx_after, breakdown } = seedSentence
  const { data: inserted } = await supabaseServer
    .from('sentences')
    .insert({ text, language, ctx_before, ctx_after, breakdown })
    .select()
    .single()

  const initial = (inserted ?? seedSentence) as Sentence
  return <BreakdownPage initial={initial} />
}
