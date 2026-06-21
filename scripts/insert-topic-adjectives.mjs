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
  slug: 'adjectives-in-german',
  language: 'de',
  title: 'Adjectives in German',
  word_type: 'Adjective',
  body: {
    blocks: [
      { type: 'paragraph', data: { text: 'Adjectives describe nouns: <i>ein kleiner Hund</i> — a small dog, <i>eine schöne Stadt</i> — a beautiful city.' } },
      { type: 'paragraph', data: { text: 'In German, adjectives often change their ending. The ending depends on three things: the noun\'s <b>gender</b>, <b>case</b>, and <b>number</b> — and also on the word before the adjective.' } },

      { type: 'header', data: { text: 'Position', level: 2 } },
      { type: 'paragraph', data: { text: 'Adjectives can appear in two main positions.' } },
      { type: 'paragraph', data: { text: '<b>Before a noun</b> — the adjective usually takes an ending: <i>der kleine Hund</i> (the small dog), <i>eine schöne Stadt</i> (a beautiful city).' } },
      { type: 'paragraph', data: { text: '<b>After verbs like <i>sein</i>, <i>bleiben</i>, or <i>werden</i></b> — the adjective does not change: <i>Der Hund ist klein.</i> (The dog is small.) <i>Die Stadt bleibt schön.</i> (The city remains beautiful.)' } },

      { type: 'header', data: { text: 'Adjective endings', level: 2 } },
      { type: 'paragraph', data: { text: 'When an adjective comes before a noun, its ending helps show the noun\'s grammar. The ending changes with case:' } },
      { type: 'paragraph', data: { text: '<i>ein kleiner Hund</i> — masculine nominative singular' } },
      { type: 'paragraph', data: { text: '<i>ich sehe einen kleinen Hund</i> — masculine accusative singular' } },
      { type: 'paragraph', data: { text: '<i>mit einem kleinen Hund</i> — masculine dative singular' } },

      { type: 'header', data: { text: 'Strong, weak, and mixed endings', level: 2 } },
      { type: 'paragraph', data: { text: 'The right ending depends on whether the article before the adjective already shows enough grammar information.' } },
      { type: 'paragraph', data: { text: '<b>Weak endings</b> — after <i>der</i>, <i>die</i>, <i>das</i>, the article clearly shows gender and case, so the adjective takes a minimal ending: <i>der kleine Hund</i>, <i>die kleine Katze</i>, <i>das kleine Kind</i>.' } },
      { type: 'paragraph', data: { text: '<b>Mixed endings</b> — after <i>ein</i>, <i>eine</i>, the article does not always carry the full signal, so the adjective sometimes carries it instead: <i>ein kleiner Hund</i> (masculine nominative — ein carries no signal here, so the adjective takes -er), <i>eine kleine Katze</i>, <i>ein kleines Kind</i>.' } },
      { type: 'paragraph', data: { text: '<b>Strong endings</b> — with no article at all, the adjective carries the main grammar signal itself: <i>kleiner Hund</i>, <i>kaltes Wasser</i>, <i>schöne Blumen</i>.' } },

      { type: 'header', data: { text: 'Comparative and superlative', level: 2 } },
      { type: 'paragraph', data: { text: 'The comparative usually adds <b>-er</b>: <i>klein → kleiner</i> (small → smaller), <i>schnell → schneller</i> (fast → faster).' } },
      { type: 'paragraph', data: { text: 'The superlative uses <b>am … -sten</b> after a verb: <i>Der Hund ist am kleinsten.</i> (The dog is the smallest.)' } },
      { type: 'paragraph', data: { text: 'Before a noun, the superlative takes normal adjective endings: <i>der kleinste Hund</i> (the smallest dog).' } },

      { type: 'header', data: { text: 'Common irregular forms', level: 2 } },
      { type: 'paragraph', data: { text: 'Some common adjectives change their stem when compared:' } },
      { type: 'paragraph', data: { text: '<i>gut → besser → am besten</i> — good → better → best' } },
      { type: 'paragraph', data: { text: '<i>viel → mehr → am meisten</i> — much/many → more → most' } },
      { type: 'paragraph', data: { text: '<i>hoch → höher → am höchsten</i> — high → higher → highest' } },
      { type: 'paragraph', data: { text: '<i>nah → näher → am nächsten</i> — near → nearer → nearest' } },

      { type: 'header', data: { text: 'Practical tip', level: 2 } },
      { type: 'paragraph', data: { text: 'To understand an adjective ending, first find the noun it belongs to. Then check the noun\'s gender, case, and number — and look at whether there is an article before the adjective.' } },
    ]
  }
}

const { error } = await supabase.from('topics').upsert(topic, { onConflict: 'slug' })
if (error) { console.error('Error:', error.message); process.exit(1) }
console.log('✓ Inserted "Adjectives in German"')
