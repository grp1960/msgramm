import Breakdown from '@/components/Breakdown'
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
    return <main className="px-4 py-6 text-red-600">Failed to load sentence.</main>
  }

  return (
    <main style={{ maxWidth: 860, padding: '40px 48px' }}>
      <Breakdown sentence={data as Sentence} />
    </main>
  )
}
