import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const USER_ID = '95038ed2-fa7e-4c50-b83b-3e98d4e605fe'
const CUTOFF  = '2026-06-09'

const { data: old } = await supabase
  .from('sentences')
  .select('id, text, created_at')
  .lt('created_at', CUTOFF)

console.log(`Found ${old.length} sentences before ${CUTOFF}`)

const rows = old.map(s => ({ user_id: USER_ID, sentence_id: s.id }))

const { error } = await supabase
  .from('saved_sentences')
  .upsert(rows, { onConflict: 'user_id,sentence_id', ignoreDuplicates: true })

if (error) { console.error(error.message); process.exit(1) }

old.forEach(s => console.log(`  ✓ ${s.created_at.slice(0,10)}  ${s.text.slice(0,60)}`))
console.log('\nDone.')
