import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('sentences')
  .select('id, text')
  .order('created_at', { ascending: true })
  .limit(3)

if (error) { console.error('Fetch error:', error.message); process.exit(1) }

console.log('Flagging these 3 sentences:')
data.forEach(s => console.log(` - ${s.id}: ${s.text.slice(0, 60)}`))

const ids = data.map(s => s.id)
const { error: updateError } = await supabase
  .from('sentences')
  .update({ needs_refresh: true })
  .in('id', ids)

if (updateError) { console.error('Update error:', updateError.message); process.exit(1) }
console.log('Done — 3 sentences flagged.')
