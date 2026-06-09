/**
 * analyse-local.mjs
 * Send a sentence to a local LM Studio model, insert the result into Supabase.
 *
 * Usage:
 *   node scripts/analyse-local.mjs "Wir wollten gestern ins Kino gehen, aber es war bereits ausverkauft."
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import http from 'node:http'

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 600_000,
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: () => data, json: () => JSON.parse(data) }))
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const LMSTUDIO_URL = 'http://localhost:1234/v1/chat/completions'
const MODEL = 'qwen/qwen3.6-35b-a3b'

const SYSTEM_PROMPT = `You are a linguistic data parser. Your sole function is to analyse a sentence
and return a single valid JSON object. No text outside the JSON. No markdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVED WORD TYPES — use these exact strings only, nothing else:
  Pronoun · Verb · Helper verb · Modal verb · Noun · Article ·
  Article contraction · Preposition · Reason connector · Condition opener ·
  Negation · Pointing word · Time word · Conjunction · Adverb · Adjective

DEFINITIONS (use these to choose the correct type):
  Pronoun          — stands in for a noun (I, she, it, wir, es)
  Verb             — main action or state (go, sein, laufen)
  Helper verb      — builds tense alongside a main verb (is, was, had, haben, sein, werden)
  Modal verb — adds condition or likelihood (can, would, must, wollen, können, müssen, sollen, dürfen, mögen)
  Noun             — person, place, thing, or idea
  Article          — marks a noun and shows gender/case (the, a, der, die, das, ein, eine)
  Article contraction — preposition fused with article (ins=in+das, am=an+dem, zum=zu+dem, im=in+dem)
  Preposition      — shows relationship: direction, time, location (in, auf, mit, für)
  Reason connector — links cause to effect (because, since, weil, da, denn)
  Condition opener — opens a hypothetical (if, falls, wenn used conditionally)
  Negation         — denies or reverses (not, never, nicht, kein)
  Pointing word    — points to something known (this, that, diese, solche, jene)
  Time word        — anchors action in time (yesterday, always, gestern, dann, morgen)
  Conjunction      — connects clauses or words (and, but, or, und, aber, oder, jedoch)
  Adverb           — modifies a verb or adjective (very, already, sehr, bereits, schon)
  Adjective        — describes a noun (red, tired, sold out, müde, ausverkauft, groß)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TERMINOLOGY RULES — apply strictly to form, note, and job fields:
  NEVER use: Infinitive · Präteritum · Imperfekt · Nominativ · Akkusativ · Dativ ·
             Genitiv · modal · auxiliary · participle · subordinating · lemma ·
             morphology · syntax · coordinate conjunction · adverbial modifier
  INSTEAD use:
    Infinitive        → Base form
    Präteritum        → Past
    case names        → describe as role: subject, object, destination, means, owner
    past participle   → completed form of [verb]
    modal verb        → Modal verb (in type field) / modal verb (in text)

FORM FIELD RULES:
  Verbs / Helper verbs     → state: tense + "· [person] · because [subject]"
  Infinitives after modals → "Base form · no person — [modal] carries it"
  Article contractions     → "From [preposition] + [article]"
  Everything else          → "Base form" or omit if nothing useful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRACTIONS RULE:
  Split every contraction into separate word entries.
  "I'd" → wid N: "I" (Pronoun) + wid N+1: "'d" (Modal verb: would)
  "it's" → wid N: "it" (Pronoun) + wid N+1: "'s" (Helper verb: is)
  "ins"  → single entry, type: Article contraction (already one fused token)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FIELDS PER WORD TYPE — include as DIRECT fields on the word object:
  case   → REQUIRED on: Noun, Article, Article contraction, Pronoun
           (inflected languages only: German, Latin, etc.)
           Values: Nominative · Accusative · Dative · Genitive
  gender → REQUIRED on: Noun, Article, Article contraction, Pronoun
           (inflected languages only)
           Values: Masculine · Feminine · Neuter
  number → REQUIRED on: Noun, Pronoun
           Values: Singular · Plural
  tense  → REQUIRED on: Verb, Helper verb
           Values: Present · Past · Perfect · Pluperfect · Future
  person → REQUIRED on: Verb, Helper verb, Modal verb
           Values: 1st singular · 2nd singular · 3rd singular ·
                   1st plural · 2nd plural · 3rd plural

  These fields MUST appear directly on the word object.
  The rationale explains them — it does not replace them.
  NEVER write "N/A" — if a field does not apply, omit it entirely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATIONALE RULES:
  Include one key per applicable field, plus "type". Each value: one sentence.
  Key names must match exactly: type · case · gender · number · tense · person
  Prefer transferable rules over one-off facts.
  Omit any rationale key that does not apply to the word type.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT SCHEMA — follow exactly:

{
  "language": "detected ISO 639-1 code (de, en, la, fr, es, ...)",
  "text": "the sentence exactly as given",
  "ctx_before": "one natural preceding sentence",
  "ctx_after": "one natural following sentence",
  "ctx_before_translation": "English translation of ctx_before",
  "ctx_after_translation": "English translation of ctx_after",
  "difficulty": "Beginner | Intermediate | Advanced | Expert",
  "tags": ["3-6 lowercase-hyphenated tags: grammar concepts and register"],
  "breakdown": {
    "translation": "natural English translation of the sentence",
    "difficulty": "same as above",
    "tags": ["same as above"],
    "explanation": "2-3 sentences on the key grammar, plain language only",
    "trap": "one common error — show the wrong version and why it fails",
    "words": [
      {
        "wid": 1,
        "word": "exact word as it appears",
        "type": "approved type from the list above",
        "translation": "English meaning, 1-2 words (required for every word)",
        "form": "see form field rules above",
        "note": "plain-language explanation of what this word does (omit if obvious)",
        "job": "one short phrase: role this word plays in this sentence",
        "case": "Nominative | Accusative | Dative | Genitive  (where required)",
        "gender": "Masculine | Feminine | Neuter  (where required)",
        "number": "Singular | Plural  (where required)",
        "tense": "Present | Past | Perfect | Pluperfect | Future  (where required)",
        "person": "1st singular to 3rd plural  (where required)",
        "rationale": {
          "type": "one sentence: why this word has this type",
          "case": "one sentence: why this case, stated as role not case name",
          "gender": "one sentence: a reusable rule or pattern",
          "number": "one sentence: why singular or plural",
          "tense": "one sentence: why this tense",
          "person": "one sentence: why this person — who is the subject?"
        }
      }
    ]
  }
}`

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sentence = args.filter(a => !a.startsWith('--'))[0]

if (!sentence) {
  console.error('Usage: node scripts/analyse-local.mjs "Your sentence here." [--dry-run]')
  console.error('  --dry-run   Print JSON only, do not insert into Supabase')
  process.exit(1)
}

console.log(`Analysing: "${sentence}"`)
console.log('Calling LM Studio…')

const res = await httpPost(LMSTUDIO_URL, {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: sentence },
    ],
    max_tokens: 4096,
    temperature: 0.1,
    stream: false,
})

if (!res.ok) {
  console.error(`LM Studio error: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const json = await res.json()
const raw = json.choices?.[0]?.message?.content

if (!raw) {
  console.error('No content in response')
  console.error(JSON.stringify(json, null, 2))
  process.exit(1)
}

// Strip markdown code fences if model adds them anyway
const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

let record
try {
  record = JSON.parse(cleaned)
} catch (e) {
  console.error('Failed to parse JSON from model output:')
  console.error(cleaned)
  process.exit(1)
}

if (dryRun) {
  console.log('\n--- JSON output (dry run — not inserted) ---\n')
  console.log(JSON.stringify(record, null, 2))
  process.exit(0)
}

console.log(`\nParsed OK — inserting into Supabase…`)

const { data, error } = await supabase
  .from('sentences')
  .insert({
    language:               record.language,
    text:                   record.text,
    difficulty:             record.difficulty ?? record.breakdown?.difficulty ?? null,
    tags:                   record.tags        ?? record.breakdown?.tags        ?? [],
    ctx_before:             record.ctx_before             ?? null,
    ctx_after:              record.ctx_after              ?? null,
    ctx_before_translation: record.ctx_before_translation ?? null,
    ctx_after_translation:  record.ctx_after_translation  ?? null,
    breakdown:              record.breakdown,
    needs_refresh:          false,
  })
  .select('id, text')
  .single()

if (error) {
  console.error(`Insert failed: ${error.message}`)
  process.exit(1)
}

console.log(`\n✓ Inserted: "${data.text}"`)
console.log(`  id: ${data.id}`)
