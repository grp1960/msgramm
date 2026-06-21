/**
 * Refresh all sentences marked needs_refresh = true.
 * Calls OpenAI and Supabase directly — no Vercel timeout risk.
 *
 * Usage:
 *   node scripts/refresh-sentences.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (or SUPABASE_SERVICE_ROLE_KEY)
 *   OPENAI_API_KEY
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Load .env.local
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const DELAY_MS = 1500

// Keep in sync with lib/prompt.ts
const SYSTEM_PROMPT = readFileSync('lib/prompt.ts', 'utf8')
  .match(/`([\s\S]+)`/)?.[1] ?? ''

async function regenerate(sentence) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Language: ${sentence.language}\nSentence: ${sentence.text}${sentence.concepts?.length ? `\nFocus concepts: ${sentence.concepts.join(', ')}` : ''}` },
    ],
    temperature: 0.2,
  })
  return JSON.parse(response.choices[0].message.content ?? '{}')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id, text, language, concepts')
    .eq('needs_refresh', true)
    .order('created_at', { ascending: true })

  if (error) { console.error('Failed to fetch:', error.message); process.exit(1) }
  if (!sentences.length) { console.log('Nothing to refresh.'); return }

  console.log(`Refreshing ${sentences.length} sentences...\n`)

  let success = 0, failed = 0

  for (const [i, s] of sentences.entries()) {
    process.stdout.write(`[${i + 1}/${sentences.length}] ${s.language.toUpperCase()}: ${s.text.slice(0, 60)}... `)
    try {
      const breakdown = await regenerate(s)
      const difficulty = breakdown.difficulty ?? 'Intermediate'
      const tags = Array.isArray(breakdown.tags) ? breakdown.tags : []

      const { error: updateError } = await supabase
        .from('sentences')
        .update({ breakdown, difficulty, tags, needs_refresh: false })
        .eq('id', s.id)

      if (updateError) throw new Error(updateError.message)
      console.log(`✓ ${difficulty} [${tags.slice(0, 3).join(', ')}]`)
      success++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      failed++
    }

    if (i < sentences.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\nDone. ${success} refreshed, ${failed} failed.`)
  const msg = `${success} refreshed, ${failed} failed.`
  try {
    const { execSync } = await import('child_process')
    execSync(`powershell -ExecutionPolicy Bypass -File "scripts/notify.ps1" -Title "Ms. Gramm: refresh done" -Message "${msg}"`, { stdio: 'ignore' })
  } catch {}
}

run()
