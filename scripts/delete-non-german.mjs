import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error: fetchErr } = await supabase
  .from('sentences')
  .select('id, language, text')
  .neq('language', 'de')

if (fetchErr) { console.error(fetchErr.message); process.exit(1) }

if (!data.length) { console.log('No non-German sentences found.'); process.exit(0) }

console.log(`Found ${data.length} non-German sentence(s):`)
data.forEach(s => console.log(`  [${s.language}] ${s.text.slice(0, 60)}`))

const { error: delErr } = await supabase
  .from('sentences')
  .delete()
  .neq('language', 'de')

if (delErr) { console.error('Delete failed:', delErr.message); process.exit(1) }
console.log(`\n✓ Deleted ${data.length} sentence(s).`)
