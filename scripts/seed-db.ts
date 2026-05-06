import { createClient } from '@supabase/supabase-js'
import { seedSentence } from '../lib/seed'

const supabase = createClient(
  'https://jmtqfhcebhoqgsvexxjo.supabase.co',
  'sb_publishable_VWd8TVuy-XSgo7ue_89l9Q_CFaviKOb'
)

async function seed() {
  const { error } = await supabase.from('sentences').upsert({
    language: seedSentence.language,
    text: seedSentence.text,
    ctx_before: seedSentence.ctx_before,
    ctx_after: seedSentence.ctx_after,
    breakdown: seedSentence.breakdown,
  })
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  console.log('Seeded successfully.')
}

seed()
