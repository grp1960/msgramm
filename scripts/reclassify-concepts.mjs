/**
 * Batch reclassify concept tags on all sentences using GPT.
 * Outputs a CSV to stdout for review — does NOT write to DB.
 * Usage: node scripts/reclassify-concepts.mjs > reclassify-review.csv
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import OpenAI from 'openai'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const VALID_CONCEPTS = [
  'separable-verbs', 'konjunktiv-ii', 'konjunktiv-i', 'modal-verbs', 'passive-voice',
  'reflexive-verbs', 'verb-tenses',
  'case-nominative', 'case-accusative', 'case-dative', 'case-genitive',
  'personal-pronouns', 'relative-pronouns', 'demonstrative-pronouns', 'indefinite-pronouns',
  'adjective-declension',
  'two-way-preps', 'accusative-preps', 'dative-preps', 'genitive-preps',
  'verb-second', 'subordinate-clauses', 'coordinating-conjunctions', 'negation',
]

const SYSTEM_PROMPT = `You are a German grammar expert. Given a German sentence, assign ALL grammar concepts that are meaningfully illustrated by it.

VALID CONCEPTS — use only these exact strings:
${VALID_CONCEPTS.join(', ')}

RULES:
- Assign a concept only if the sentence genuinely illustrates or requires it as a teaching point
- Do NOT assign case concepts (case-accusative etc.) just because the sentence contains nouns — only tag them if the case is a notable teaching point (unusual, easily confused, or central to understanding the sentence)
- subordinate-clauses: only tag if a subordinate clause is a clear structural feature worth teaching
- verb-second: only tag if inversion after a fronted element is a notable feature
- Aim for 2–4 concepts per sentence, focused on what a learner would actually study this sentence for
- Return ONLY a JSON array of concept strings, nothing else

Example output: ["konjunktiv-ii", "subordinate-clauses", "verb-second"]`

const { data: sentences } = await supabase
  .from('sentences')
  .select('id, text, difficulty, concepts')
  .order('difficulty')
  .order('created_at')

// CSV header
process.stdout.write('id,difficulty,text,current_concepts,suggested_concepts,changed\n')

for (const s of sentences) {
  process.stderr.write(`Processing: ${s.text.slice(0, 60)}...\n`)

  let suggested = []
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Sentence: ${s.text}\nReturn: {"concepts": [...]}` },
      ],
      max_tokens: 200,
    })
    const parsed = JSON.parse(res.choices[0].message.content ?? '{}')
    suggested = Array.isArray(parsed.concepts) ? parsed.concepts.filter(c => VALID_CONCEPTS.includes(c)) : []
  } catch (e) {
    process.stderr.write(`  ERROR: ${e.message}\n`)
  }

  const current = (s.concepts ?? []).sort().join(' | ')
  const proposed = suggested.sort().join(' | ')
  const changed = current !== proposed ? 'YES' : 'no'

  // Escape for CSV
  const escape = str => `"${str.replace(/"/g, '""')}"`
  process.stdout.write([
    escape(s.id),
    escape(s.difficulty),
    escape(s.text),
    escape(current),
    escape(proposed),
    escape(changed),
  ].join(',') + '\n')
}

process.stderr.write('\nDone.\n')
