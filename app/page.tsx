import BreakdownPage from '@/components/BreakdownPage'
import { supabase } from '@/lib/supabase'
import { Sentence } from '@/lib/types'

export default async function Home() {
  const { data, error } = await supabase
    .from('sentences')
    .select('*')
    .eq('language', 'de')
    .limit(1)
    .single()

  if (error || !data) {
    return <main style={{ padding: '40px 48px', color: '#c0392b' }}>Failed to load sentence.</main>
  }

  return <BreakdownPage initial={data as Sentence} />
}
