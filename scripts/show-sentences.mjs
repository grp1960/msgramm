import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await supabase
  .from('sentences')
  .select('id, text, created_at')
  .order('created_at', { ascending: true })

data.forEach(s => console.log(`${s.created_at.slice(0,10)}  ${s.id.slice(0,8)}  ${s.text.slice(0,60)}`))
