import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const[k,...v]=l.split('=');return[k.trim(),v.join('=').trim()]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const ids = [
  '0fffd586-ef58-4248-bf1c-f1ddde6f6d91',
  '6b082cff-321a-49e5-9267-dc889cd50692',
  '7d363325-76ce-4744-a05e-bb276fb7a331',
  'f3d25669-cdf5-41e8-a58b-f78113ac4f8c',
  'eec55d25-8967-4698-812a-b3f463dc7eff',
  '9ba11db1-2205-4465-aee8-8348e7580ad7',
]

const {data} = await sb.from('sentences').select('id,text,breakdown').in('id', ids)
for (const s of data) {
  console.log(`\n--- ${s.text.slice(0,60)} ---`)
  const words = s.breakdown.words
  for (const w of words) {
    const issues = []
    // Adjective should NOT have case/gender/number
    if (w.type === 'Adjective' && (w.case || w.gender || w.number)) {
      issues.push(`Adjective has case/gender/number: ${JSON.stringify({case:w.case,gender:w.gender,number:w.number})}`)
    }
    // Verb/Helper verb should have tense
    if ((w.type === 'Verb' || w.type === 'Helper verb') && !w.tense) {
      issues.push(`Missing tense`)
    }
    // Verb/Helper verb/Modal verb should have person
    if ((w.type === 'Verb' || w.type === 'Helper verb' || w.type === 'Modal verb') && !w.person) {
      issues.push(`Missing person`)
    }
    // Noun/Article/Pronoun should have case
    if (['Noun','Article','Article contraction','Pronoun'].includes(w.type) && !w.case) {
      issues.push(`Missing case`)
    }
    // Check for old type name
    if (w.type === 'Possibility verb') {
      issues.push(`OLD TYPE: Possibility verb`)
    }
    if (issues.length) {
      console.log(`  wid ${w.wid} "${w.word}" (${w.type}): ${issues.join(' | ')}`)
    }
  }
}
console.log('\nDone.')
