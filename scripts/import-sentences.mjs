/**
 * Import sentences into Ms. Gramm.
 * Format: one sentence per line (blank lines ignored).
 *
 * Usage:
 *   node scripts/import-sentences.mjs
 *
 * Calls the live /api/breakdown endpoint which handles GPT + Supabase insert.
 * Edit BASE_URL and SENTENCES below before running.
 */

const BASE_URL = 'https://msgramm.vercel.app'  // change if needed
const LANGUAGE = 'en'
const DELAY_MS = 1500  // pause between calls to stay under rate limits

const SENTENCES = `
The neighbor's dog is faster than our dog, but its behavior is often contradictory.
He says that he must ask the doctor for a clarification regarding the nuance of his sister's diagnosis.
I have already cleaned my room today, which is a remarkable change from my usual routine.
If I were rich, I would buy the big house and hire someone to explain every linguistic nuance to me.
She is being helped by her friend because the instructions for the project were contradictory.
You should not put the keys on the table without providing a clarification about where they belong.
I am washing myself before I go to bed because the heat today was truly remarkable.
Without a coat, it is too cold outside, which seems contradictory since it was warm an hour ago.
Give me the book that is lying on the chair so I can find a clarification for this specific nuance.
`.trim().split('\n').map(s => s.trim()).filter(Boolean)

async function importSentence(text) {
  const res = await fetch(`${BASE_URL}/api/breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence: text, language: LANGUAGE }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HTTP ${res.status}: ${err}`)
  }
  return res.json()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  console.log(`Importing ${SENTENCES.length} sentences...\n`)
  for (let i = 0; i < SENTENCES.length; i++) {
    const text = SENTENCES[i]
    process.stdout.write(`[${i + 1}/${SENTENCES.length}] ${text.slice(0, 60)}... `)
    try {
      const data = await importSentence(text)
      console.log(`✓ ${data.difficulty} [${(data.tags ?? []).join(', ')}]`)
    } catch (e) {
      console.log(`✗ ${e.message}`)
    }
    if (i < SENTENCES.length - 1) await sleep(DELAY_MS)
  }
  console.log('\nDone.')
}

run()
