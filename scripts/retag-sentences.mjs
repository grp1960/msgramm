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

const TAXONOMY = [
  'separable-verbs', 'konjunktiv-ii', 'modal-verbs', 'passive-voice',
  'reflexive-verbs', 'verb-tenses', 'konjunktiv-i',
  'case-nominative', 'case-accusative', 'case-dative', 'case-genitive',
  'personal-pronouns', 'relative-pronouns', 'demonstrative-pronouns', 'indefinite-pronouns',
  'adjective-declension',
  'two-way-preps', 'accusative-preps', 'dative-preps', 'genitive-preps',
  'verb-second', 'subordinate-clauses', 'coordinating-conjunctions', 'negation',
]

const SYSTEM = `You are a German grammar tagger. Given a sentence and its word-by-word breakdown, return a JSON array of concept IDs that apply to this sentence.

Only return IDs from this list — no others:
${TAXONOMY.join(', ')}

Rules:
- Include a concept if it is meaningfully illustrated in the sentence, not just incidentally present
- case-accusative: sentence has a clear accusative object
- case-dative: sentence has a dative object or dative-governing preposition
- case-nominative: nominative is the explicit teaching point (rarely tag this)
- case-genitive: sentence has a genitive construction
- subordinate-clauses: sentence contains a subordinate clause (weil, dass, obwohl, nachdem, wenn, etc.)
- verb-second: inverted word order is a key feature (often pairs with subordinate-clauses)
- separable-verbs: sentence contains a separable verb with its prefix split off
- konjunktiv-ii: sentence uses Konjunktiv II (würde, wäre, hätte, könnte, etc.)
- konjunktiv-i: sentence uses Konjunktiv I (reported speech forms like brauche, solle, sei)
- modal-verbs: sentence contains a modal verb (können, müssen, sollen, wollen, dürfen, mögen)
- passive-voice: sentence uses passive construction (wird + past participle, wurde, etc.)
- reflexive-verbs: sentence contains a reflexive verb (sich + verb)
- verb-tenses: tense contrast or a non-present tense is the explicit focus
- adjective-declension: sentence features adjective endings as a key teaching point
- two-way-preps: sentence uses a two-way preposition (an, auf, in, über, unter, vor, hinter, neben, zwischen)
- dative-preps: sentence uses a dative-only preposition (mit, nach, bei, von, zu, seit, gegenüber, aus)
- accusative-preps: sentence uses an accusative-only preposition (durch, für, gegen, ohne, um)
- genitive-preps: sentence uses a genitive preposition (wegen, trotz, während, innerhalb, etc.)
- personal-pronouns: pronoun usage is a key feature
- relative-pronouns: sentence contains a relative clause
- demonstrative-pronouns: sentence uses dieser, jener, derjenige, etc. as a key feature
- indefinite-pronouns: sentence uses man, jemand, etwas, nichts, etc. as a key feature
- negation: nicht or kein is a key feature
- coordinating-conjunctions: aber, oder, denn, sondern is a key feature

Return a JSON object with a single key "concepts" whose value is an array of strings, e.g. {"concepts": ["subordinate-clauses", "case-accusative"]}`

const { data: sentences } = await supabase
  .from('sentences')
  .select('id, text, breakdown, concepts')
  .order('created_at', { ascending: true })

console.log(`Retagging ${sentences.length} sentences...\n`)

for (const s of sentences) {
  const wordList = s.breakdown.words
    .map(w => `${w.word} (${w.type}${w.case ? ', ' + w.case : ''})`)
    .join(', ')

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Sentence: ${s.text}\nWords: ${wordList}` },
    ],
    temperature: 0,
    max_tokens: 200,
  })

  let concepts
  try {
    const parsed = JSON.parse(res.choices[0].message.content)
    concepts = Array.isArray(parsed) ? parsed : (parsed.concepts ?? parsed.tags ?? [])
  } catch {
    console.log(`  ✗ ${s.text.slice(0, 50)} — parse error`)
    continue
  }

  const valid = concepts.filter(c => TAXONOMY.includes(c))

  await supabase.from('sentences').update({ concepts: valid }).eq('id', s.id)

  const was = (s.concepts ?? []).join(', ') || '(none)'
  const now = valid.join(', ') || '(none)'
  console.log(`${s.text.slice(0, 55)}`)
  console.log(`  was: ${was}`)
  console.log(`  now: ${now}\n`)
}

console.log('Done.')
