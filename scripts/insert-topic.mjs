/**
 * Insert a topic into the topics table.
 * Usage: node scripts/insert-topic.mjs
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const topic = {
  slug: 'nouns-in-german',
  language: 'de',
  title: 'Nouns in German',
  word_type: 'Noun',
  body: {
    blocks: [
      { type: 'paragraph', data: { text: 'Every German noun has three key properties that affect how surrounding words like articles and adjectives are written: <b>gender</b>, <b>case</b>, and <b>number</b>.' } },
      { type: 'header', data: { text: 'Gender', level: 2 } },
      { type: 'paragraph', data: { text: 'Every noun is one of three genders: masculine (<i>der Hund</i> — the dog), feminine (<i>die Frau</i> — the woman), or neuter (<i>das Kind</i> — the child). Gender must be memorised with each noun — it cannot always be predicted from meaning.' } },
      { type: 'paragraph', data: { text: 'Some endings are reliable guides: nouns ending in <b>-ung</b> are always feminine (<i>die Zeitung</i>, <i>die Meinung</i>). Nouns ending in <b>-chen</b> or <b>-lein</b> are always neuter (<i>das Mädchen</i>, <i>das Büchlein</i>).' } },
      { type: 'header', data: { text: 'Case', level: 2 } },
      { type: 'paragraph', data: { text: 'German nouns change their article depending on their role in the sentence. There are four cases:' } },
      { type: 'paragraph', data: { text: '<b>Nominative</b> — the subject, the noun doing the action. <i>Der Hund schläft.</i> (The dog sleeps.)' } },
      { type: 'paragraph', data: { text: '<b>Accusative</b> — the direct object, receiving the action. <i>Ich sehe den Hund.</i> (I see the dog.)' } },
      { type: 'paragraph', data: { text: '<b>Dative</b> — the indirect object. <i>Ich gebe dem Hund Wasser.</i> (I give water to the dog.)' } },
      { type: 'paragraph', data: { text: '<b>Genitive</b> — shows possession. <i>Das Spielzeug des Hundes.</i> (The dog\'s toy.)' } },
      { type: 'header', data: { text: 'Number', level: 2 } },
      { type: 'paragraph', data: { text: 'German nouns have singular and plural forms. Unlike English, there is no single rule — each noun\'s plural must be learned. Common patterns: add <b>-e</b> (<i>Hund → Hunde</i>), <b>-er</b> (<i>Kind → Kinder</i>), or <b>-en</b> (<i>Frau → Frauen</i>).' } },
    ]
  }
}

const { error } = await supabase.from('topics').upsert(topic, { onConflict: 'slug' })
if (error) { console.error('Error:', error.message); process.exit(1) }
console.log('✓ Inserted "Nouns in German"')
