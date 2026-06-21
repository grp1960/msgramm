/**
 * import-json.mjs
 * Insert one or more fully-analysed sentences from a JSON file.
 *
 * Usage:
 *   node scripts/import-json.mjs <path-to-json-file>
 *
 * The JSON file can contain a single object or an array of objects.
 * Each object must have at minimum: language, text, breakdown.
 * If needs_refresh is not set, defaults to false (breakdown is assumed complete).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/import-json.mjs <path-to-json-file>')
  process.exit(1)
}

const raw = readFileSync(resolve(filePath), 'utf-8')
const parsed = JSON.parse(raw)
const rows = Array.isArray(parsed) ? parsed : [parsed]

console.log(`Importing ${rows.length} sentence(s)…`)

for (const row of rows) {
  const record = {
    language:               row.language,
    text:                   row.text,
    difficulty:             row.difficulty ?? row.breakdown?.difficulty ?? null,
    tags:                   row.tags        ?? row.breakdown?.tags        ?? [],
    ctx_before:             row.ctx_before             ?? null,
    ctx_after:              row.ctx_after              ?? null,
    ctx_before_translation: row.ctx_before_translation ?? null,
    ctx_after_translation:  row.ctx_after_translation  ?? null,
    breakdown:              row.breakdown,
    needs_refresh:          row.needs_refresh ?? false,
  }

  const { data, error } = await supabase
    .from('sentences')
    .insert(record)
    .select('id, text')
    .single()

  if (error) {
    console.error(`  ✗ "${record.text.slice(0, 60)}"`)
    console.error(`    ${error.message}`)
  } else {
    console.log(`  ✓ "${data.text.slice(0, 60)}"`)
    console.log(`    id: ${data.id}`)
  }
}
