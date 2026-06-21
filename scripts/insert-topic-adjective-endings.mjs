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
  slug: 'adjective-endings-in-german',
  language: 'de',
  title: 'Adjective endings in German',
  word_type: 'Adjective',
  body: {
    blocks: [
      { type: 'header', data: { text: '1. Weak endings — after der, die, das', level: 2 } },
      { type: 'paragraph', data: { text: 'Used after definite articles and similar words like <i>dieser</i>, <i>jeder</i>, <i>welcher</i>.' } },
      { type: 'table', data: {
        headers: ['Case', 'Masculine', 'Feminine', 'Neuter', 'Plural'],
        rows: [
          ['Nominative', 'der klein<b>e</b> Hund', 'die klein<b>e</b> Katze', 'das klein<b>e</b> Kind', 'die klein<b>en</b> Hunde'],
          ['Accusative', 'den klein<b>en</b> Hund', 'die klein<b>e</b> Katze', 'das klein<b>e</b> Kind', 'die klein<b>en</b> Hunde'],
          ['Dative', 'dem klein<b>en</b> Hund', 'der klein<b>en</b> Katze', 'dem klein<b>en</b> Kind', 'den klein<b>en</b> Hunden'],
          ['Genitive', 'des klein<b>en</b> Hundes', 'der klein<b>en</b> Katze', 'des klein<b>en</b> Kindes', 'der klein<b>en</b> Hunde'],
        ]
      }},
      { type: 'paragraph', data: { text: '<b>Main pattern:</b> mostly <b>-en</b>, except nominative singular and feminine/neuter accusative, which use <b>-e</b>.' } },

      { type: 'header', data: { text: '2. Mixed endings — after ein, eine, kein, mein', level: 2 } },
      { type: 'paragraph', data: { text: 'Used after ein-words: <i>ein</i>, <i>kein</i>, <i>mein</i>, <i>dein</i>, <i>sein</i>, <i>ihr</i>, <i>unser</i>, <i>euer</i>.' } },
      { type: 'table', data: {
        headers: ['Case', 'Masculine', 'Feminine', 'Neuter', 'Plural'],
        rows: [
          ['Nominative', 'ein klein<b>er</b> Hund', 'eine klein<b>e</b> Katze', 'ein klein<b>es</b> Kind', 'meine klein<b>en</b> Hunde'],
          ['Accusative', 'einen klein<b>en</b> Hund', 'eine klein<b>e</b> Katze', 'ein klein<b>es</b> Kind', 'meine klein<b>en</b> Hunde'],
          ['Dative', 'einem klein<b>en</b> Hund', 'einer klein<b>en</b> Katze', 'einem klein<b>en</b> Kind', 'meinen klein<b>en</b> Hunden'],
          ['Genitive', 'eines klein<b>en</b> Hundes', 'einer klein<b>en</b> Katze', 'eines klein<b>en</b> Kindes', 'meiner klein<b>en</b> Hunde'],
        ]
      }},
      { type: 'paragraph', data: { text: '<b>Main pattern:</b> where <i>ein</i> does not clearly show gender, the adjective does — <i>ein klein<b>er</b> Hund</i>, <i>ein klein<b>es</b> Kind</i>. Otherwise endings follow the weak pattern.' } },
      { type: 'paragraph', data: { text: '<b>Note:</b> <i>ein</i> has no plural form, so plural examples use <i>meine</i>.' } },

      { type: 'header', data: { text: '3. Strong endings — no article', level: 2 } },
      { type: 'paragraph', data: { text: 'Used when there is no article before the adjective.' } },
      { type: 'table', data: {
        headers: ['Case', 'Masculine', 'Feminine', 'Neuter', 'Plural'],
        rows: [
          ['Nominative', 'klein<b>er</b> Hund', 'klein<b>e</b> Katze', 'klein<b>es</b> Kind', 'klein<b>e</b> Hunde'],
          ['Accusative', 'klein<b>en</b> Hund', 'klein<b>e</b> Katze', 'klein<b>es</b> Kind', 'klein<b>e</b> Hunde'],
          ['Dative', 'klein<b>em</b> Hund', 'klein<b>er</b> Katze', 'klein<b>em</b> Kind', 'klein<b>en</b> Hunden'],
          ['Genitive', 'klein<b>en</b> Hundes', 'klein<b>er</b> Katze', 'klein<b>en</b> Kindes', 'klein<b>er</b> Hunde'],
        ]
      }},

      { type: 'header', data: { text: 'What\'s all this talk about weak and strong?', level: 2 } },
      { type: 'paragraph', data: { text: 'A <b>strong ending</b> carries a clear grammar signal itself.' } },
      { type: 'paragraph', data: { text: '<i>kleiner Hund</i> — there is no article here, so <i>kleiner</i> has to show: masculine, nominative, singular. The ending <b>-er</b> is "strong" because it is doing that work on its own.' } },
      { type: 'paragraph', data: { text: 'A <b>weak ending</b> carries less information because the article already did the work.' } },
      { type: 'paragraph', data: { text: '<i>der kleine Hund</i> — <i>der</i> already shows masculine, nominative, singular. So the adjective only needs <b>-e</b>. The ending is "weak" because it is not doing much grammatical work.' } },
      { type: 'paragraph', data: { text: '<b>Mixed endings</b> are in between.' } },
      { type: 'paragraph', data: { text: '<i>ein kleiner Hund</i> — <i>ein</i> does not clearly show masculine nominative, so <i>kleiner</i> uses the stronger <b>-er</b> ending.' } },
      { type: 'paragraph', data: { text: '<i>einen kleinen Hund</i> — <i>einen</i> clearly shows masculine accusative, so <i>kleinen</i> uses the weaker <b>-en</b> ending.' } },
      { type: 'paragraph', data: { text: '<b>The rule:</b> Strong = adjective carries the signal. Weak = article carries the signal. Mixed = sometimes the article carries it, sometimes the adjective does.' } },
    ]
  }
}

const { error } = await supabase.from('topics').upsert(topic, { onConflict: 'slug' })
if (error) { console.error('Error:', error.message); process.exit(1) }
console.log('✓ Updated "Adjective endings in German"')
