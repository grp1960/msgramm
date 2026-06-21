/**
 * Generate full sentence breakdowns for validation.
 * Usage: node scripts/gen-sentences.mjs
 * Outputs a JSON array to stdout.
 */

import OpenAI from 'openai'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const raw = readFileSync('./lib/prompt.ts', 'utf8')
const SYSTEM_PROMPT = raw.slice(raw.indexOf('`') + 1, raw.lastIndexOf('`'))

const sentences = [
  {
    text: 'Dieses Buch ist interessanter als jenes.',
    concepts: ['demonstrative-pronouns'],
  },
  {
    text: 'Kannst du mir diesen Stift geben, nicht jenen?',
    concepts: ['demonstrative-pronouns', 'case-accusative', 'modal-verbs'],
  },
  {
    text: 'Ich nehme diesen Mantel, nicht den dort.',
    concepts: ['demonstrative-pronouns', 'case-accusative'],
  },
]

const results = []

for (const s of sentences) {
  process.stderr.write(`Generating: ${s.text}\n`)
  const userMsg = `Language: German\nSentence: ${s.text}\nFocus concepts: ${s.concepts.join(', ')}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  })

  const breakdown = JSON.parse(res.choices[0].message.content)
  results.push({
    text: s.text,
    concepts: s.concepts,
    breakdown,
  })
}

process.stdout.write(JSON.stringify(results, null, 2))
process.stderr.write('\nDone.\n')
