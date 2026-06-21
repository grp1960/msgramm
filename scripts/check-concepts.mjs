import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await supabase.from('sentences').select('concepts')

const all = data.flatMap(s => s.concepts ?? [])
const counts = {}
all.forEach(c => counts[c] = (counts[c] ?? 0) + 1)

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
console.log('Concept IDs in DB:')
sorted.forEach(([k, v]) => console.log(`  ${v}x  ${k}`))
