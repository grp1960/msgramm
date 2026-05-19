/**
 * Backfill ctx_before_translation and ctx_after_translation for sentences
 * that have context text but no translation yet.
 *
 * Usage:
 *   node scripts/translate-context.mjs              # uses OpenAI
 *   node scripts/translate-context.mjs --local      # uses LM Studio at localhost:1234
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * and OPENAI_API_KEY (only needed when not using --local).
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const useLocal = process.argv.includes('--local')

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const openai = new OpenAI(
  useLocal
    ? { baseURL: 'http://localhost:1234/v1', apiKey: 'local' }
    : { apiKey: env.OPENAI_API_KEY }
)

const MODEL = useLocal ? 'local-model' : 'gpt-4o-mini'
const DELAY_MS = useLocal ? 500 : 1000

console.log(`Using ${useLocal ? 'LM Studio (local)' : 'OpenAI'}...\n`)

async function translate(text, targetLang = 'English') {
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `Translate the following sentence into ${targetLang}. Return only the translation, nothing else.`,
      },
      { role: 'user', content: text },
    ],
  })
  return response.choices[0].message.content?.trim() ?? ''
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id, text, language, ctx_before, ctx_after, ctx_before_translation, ctx_after_translation')
    .or('ctx_before.not.is.null,ctx_after.not.is.null')
    .order('created_at', { ascending: true })

  if (error) { console.error('Fetch error:', error.message); process.exit(1) }

  const todo = sentences.filter(s =>
    (s.ctx_before && !s.ctx_before_translation) ||
    (s.ctx_after && !s.ctx_after_translation)
  )

  if (!todo.length) { console.log('Nothing to translate.'); return }
  console.log(`Translating context for ${todo.length} sentences...\n`)

  let success = 0, failed = 0

  for (const [i, s] of todo.entries()) {
    process.stdout.write(`[${i + 1}/${todo.length}] ${s.text.slice(0, 50)}... `)
    try {
      const updates = {}
      if (s.ctx_before && !s.ctx_before_translation) {
        updates.ctx_before_translation = await translate(s.ctx_before)
        await sleep(DELAY_MS)
      }
      if (s.ctx_after && !s.ctx_after_translation) {
        updates.ctx_after_translation = await translate(s.ctx_after)
        await sleep(DELAY_MS)
      }

      const { error: updateError } = await supabase
        .from('sentences')
        .update(updates)
        .eq('id', s.id)

      if (updateError) throw new Error(updateError.message)
      console.log('✓')
      success++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      failed++
    }
  }

  console.log(`\nDone. ${success} updated, ${failed} failed.`)
}

run()
