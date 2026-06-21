/**
 * Refresh a single sentence by text.
 * Usage: node scripts/refresh-one.mjs "Ich fahre am Wochenende mit dem Zug zum Markt."
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
const SYSTEM_PROMPT = readFileSync('lib/prompt.ts', 'utf8').match(/`([\s\S]+)`/)?.[1] ?? ''

const text = process.argv[2]
if (!text) { console.error('Usage: node scripts/refresh-one.mjs "sentence"'); process.exit(1) }

const { data: sentence, error } = await supabase
  .from('sentences')
  .select('id, language')
  .eq('text', text)
  .single()

if (error || !sentence) { console.error('Sentence not found'); process.exit(1) }

console.log(`Refreshing: ${text.slice(0, 60)}...`)

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  response_format: { type: 'json_object' },
  temperature: 0.2,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Language: ${sentence.language}\nSentence: ${text}` },
  ],
})

const breakdown = JSON.parse(response.choices[0].message.content ?? '{}')
const difficulty = breakdown.difficulty ?? 'Intermediate'
const tags = Array.isArray(breakdown.tags) ? breakdown.tags : []

const { error: updateError } = await supabase
  .from('sentences')
  .update({ breakdown, difficulty, tags, needs_refresh: false })
  .eq('id', sentence.id)

if (updateError) { console.error('Update failed:', updateError.message); process.exit(1) }
console.log(`✓ Done — ${difficulty}`)
breakdown.words.forEach(w => console.log(`  ${w.word}: type=${w.type} gender=${w.gender ?? '-'} case=${w.case ?? '-'} number=${w.number ?? '-'} translation="${w.translation ?? 'MISSING'}"`) )
