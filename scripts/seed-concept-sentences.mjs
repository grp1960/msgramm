/**
 * Seed sentences for the Two-Way Preps and Konjunktiv II concept filters.
 * Calls OpenAI and Supabase directly.
 *
 * Usage:
 *   node scripts/seed-concept-sentences.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 *   OPENAI_API_KEY
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const SYSTEM_PROMPT = readFileSync('lib/prompt.ts', 'utf8')
  .match(/`([\s\S]+)`/)?.[1] ?? ''

const SENTENCES = [
  {
    text: 'Das Bild hängt an der Wand, aber er hängt es an die andere Wand.',
    language: 'de',
    concepts: ['two-way-preps'],
    focusHint: 'This sentence deliberately contrasts dative (location: an der Wand) and accusative (destination: an die andere Wand) with the same two-way preposition. Focus the explanation and grammar trap on this accusative/dative distinction.',
  },
  {
    text: 'Wenn ich mehr Zeit hätte, würde ich jeden Tag Deutsch lernen.',
    language: 'de',
    concepts: ['konjunktiv-ii'],
    focusHint: 'This sentence is a classic Konjunktiv II conditional. Focus the explanation and grammar trap on how hätte and würde signal the hypothetical, and the common error of using present tense instead.',
  },
  {
    text: 'An deiner Stelle würde ich das nicht sagen.',
    language: 'de',
    concepts: ['konjunktiv-ii'],
    focusHint: 'This sentence uses Konjunktiv II for polite/hypothetical advice ("if I were in your position"). Focus the explanation and grammar trap on this use of würde and the An deiner Stelle construction.',
  },
  {
    text: 'Wenn er das Buch auf den Schreibtisch legen würde, könnten wir es leichter finden.',
    language: 'de',
    concepts: ['two-way-preps', 'konjunktiv-ii'],
    focusHint: 'This sentence exercises both Konjunktiv II (würde legen, könnten) and a two-way preposition (auf den Schreibtisch — accusative, direction of placement). Focus the explanation and grammar trap on how these two constructs interact.',
  },
]

async function analyse(text, language, focusHint) {
  const userContent = `Language: ${language === 'de' ? 'German' : language}\nSentence: ${text}\n\nFocus note for explanation and trap: ${focusHint}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
  })

  return JSON.parse(response.choices[0].message.content ?? '{}')
}

async function run() {
  for (const s of SENTENCES) {
    console.log(`\nProcessing: "${s.text}"`)

    // Check if already exists
    const { data: existing } = await supabase
      .from('sentences')
      .select('id, concepts')
      .eq('text', s.text)
      .eq('language', s.language)
      .maybeSingle()

    if (existing) {
      // Just update concepts if already there
      console.log(`  Already exists (${existing.id}), updating concepts...`)
      await supabase
        .from('sentences')
        .update({ concepts: s.concepts })
        .eq('id', existing.id)
      console.log(`  ✓ Concepts set to: ${s.concepts.join(', ')}`)
      continue
    }

    // Generate breakdown
    console.log('  Calling OpenAI...')
    const breakdown = await analyse(s.text, s.language, s.focusHint)

    const { data, error } = await supabase
      .from('sentences')
      .insert({
        language: s.language,
        text: s.text,
        breakdown,
        difficulty: breakdown.difficulty ?? 'Intermediate',
        tags: breakdown.tags ?? [],
        concepts: s.concepts,
        needs_refresh: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ✗ Insert failed:`, error.message)
    } else {
      console.log(`  ✓ Created ${data.id} — concepts: ${s.concepts.join(', ')}`)
    }

    // Be polite to OpenAI rate limits
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log('\nDone.')
}

run().catch(console.error)
