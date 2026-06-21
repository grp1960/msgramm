import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: profiles } = await supabase.from('profiles').select('id, email, role')
console.log('Profiles:', profiles)

const { data: saved } = await supabase.from('saved_sentences').select('user_id').limit(5)
console.log('Saved sentence user_ids:', saved)
