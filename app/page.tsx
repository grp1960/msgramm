import App from '@/components/App'
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
    .order('created_at', { ascending: true })

  let sentences = (data ?? []) as Sentence[]

  // Seed if empty
  if (sentences.length === 0) {
    const { text, language, difficulty, ctx_before, ctx_after, breakdown } = seedSentence
    const { data: inserted } = await supabaseServer
      .from('sentences')
      .insert({ text, language, difficulty, ctx_before, ctx_after, breakdown })
      .select()
      .single()
    sentences = inserted ? [inserted as Sentence] : [seedSentence]
  }

  return <App sentences={sentences} />
}
