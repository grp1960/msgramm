/**
 * Apply curated concept reclassification to the sentences table.
 * Corrections made to GPT suggestions:
 * - Brahms/Beethoven sentences: GPT wrongly tagged passive-voice; stieß auf = active
 * - Several sentences: GPT added modal-verbs where no modal exists (würde = konjunktiv-ii, not modal)
 * - Nachdem/Obwohl sentences: verb-second preserved where GPT dropped it
 * - konjunktiv-ii preserved where GPT removed it
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const updates = [
  // Advanced
  { id: '2c6b3275-8752-43e5-a3f0-75baf24a93f9', concepts: ['subordinate-clauses', 'verb-tenses'] },
  { id: '4e8d5939-205a-4148-858a-f2f90dde1e5b', concepts: ['subordinate-clauses', 'verb-tenses'] },
  { id: '7bb23d88-0a5e-4cf3-b676-2a322173875b', concepts: ['konjunktiv-ii', 'modal-verbs', 'subordinate-clauses'] },
  { id: 'c816ec9d-a2b2-43ab-81dc-6dc6468930f0', concepts: ['passive-voice', 'subordinate-clauses', 'verb-tenses'] },
  { id: '46e95638-e8ce-4177-94da-571646a413cc', concepts: ['modal-verbs', 'negation', 'subordinate-clauses', 'verb-tenses'] },
  { id: 'd346aedd-92da-428d-acab-09e0df41bd60', concepts: ['subordinate-clauses', 'verb-second'] },
  // df2ecef8: GPT added modal-verbs for "würde" — that's konjunktiv-ii not a modal
  { id: 'df2ecef8-ad59-4fd8-9961-7114072cd674', concepts: ['konjunktiv-ii', 'subordinate-clauses'] },
  { id: 'f37eba10-255a-4080-8679-3bf36044a334', concepts: ['konjunktiv-ii', 'modal-verbs', 'subordinate-clauses'] },
  // e5d03ef7 Nachdem: keep verb-second (inversion after subordinate clause), add verb-tenses
  { id: 'e5d03ef7-ede7-46fb-8d2c-35110a9787b7', concepts: ['subordinate-clauses', 'verb-second', 'verb-tenses'] },
  // 902e7987: GPT dropped separable-verbs and genitive-preps; both are genuinely present
  { id: '902e7987-0323-4dfd-b687-c0b3d6181add', concepts: ['genitive-preps', 'separable-verbs', 'subordinate-clauses', 'verb-second'] },
  { id: '833de4f1-d750-4349-821c-978166265635', concepts: ['adjective-declension', 'case-genitive', 'verb-tenses'] },
  { id: 'c7721ea3-722b-4135-a8b9-0eb0fb0ef868', concepts: ['passive-voice', 'verb-tenses'] },

  // Beginner (had no concepts at all)
  { id: '9e0941f5-025c-49e0-acc4-0e7fa68e9a35', concepts: ['adjective-declension', 'case-accusative', 'case-nominative'] },

  // Expert
  { id: 'a446dfde-9ecc-45ae-823c-06a4dccfef07', concepts: ['passive-voice', 'relative-pronouns', 'subordinate-clauses'] },
  // 6895b358: GPT dropped konjunktiv-ii but "mag" is clearly Konjunktiv II
  { id: '6895b358-88af-41ec-89a7-48697cfac6de', concepts: ['konjunktiv-ii', 'subordinate-clauses', 'verb-second'] },
  // e3cca353: keep coordinating-conjunctions for nicht nur...sondern
  { id: 'e3cca353-cc6b-44c1-b66c-41ea0673e5ea', concepts: ['coordinating-conjunctions', 'subordinate-clauses', 'verb-second'] },
  // ad496b29: GPT dropped konjunktiv-ii and reflexive-verbs; "könnte" = konjunktiv-ii, "erweisen" = reflexive
  { id: 'ad496b29-4a95-4e21-b272-fa0ce86f5939', concepts: ['konjunktiv-ii', 'reflexive-verbs', 'subordinate-clauses', 'verb-second'] },

  // Intermediate
  // 7b3c723f: add two-way-preps (an/am), remove verb-second (starts with Ich, no inversion)
  { id: '7b3c723f-67f3-42a9-9204-02a88b0001ea', concepts: ['case-dative', 'two-way-preps'] },
  { id: '2bad8302-dba5-4d44-8be6-e67ca34eb8a1', concepts: ['relative-pronouns', 'subordinate-clauses'] },
  // 0395424f: keep personal-pronouns for "mir" (dative pronoun is a teaching point)
  { id: '0395424f-c4b4-4892-a54c-1fe15cc14e03', concepts: ['personal-pronouns', 'subordinate-clauses', 'verb-second'] },
  { id: 'ba3327f2-8724-483d-aaff-aa3c4ed8f2d5', concepts: ['coordinating-conjunctions', 'verb-tenses'] },
  // 3a8ec70d Brahms: stieß auf = active (encountered), NOT passive; keep case-accusative, add verb-tenses
  { id: '3a8ec70d-e976-49fd-84d2-9d931cfded6e', concepts: ['case-accusative', 'verb-tenses'] },
  // 589fd969 Beethoven: same as Brahms above
  { id: '589fd969-5524-4e45-ba8f-bd55c232a837', concepts: ['case-accusative', 'verb-tenses'] },
  { id: '90372091-f8ec-49b6-866b-dbafb1324e9a', concepts: ['case-accusative', 'case-dative', 'coordinating-conjunctions', 'two-way-preps'] },
  // b34ae906: keep negation (nicht sagen), add verb-second (fronted element "An deiner Stelle")
  { id: 'b34ae906-71fb-4cdc-8e9a-7a53aab73364', concepts: ['konjunktiv-ii', 'negation', 'verb-second'] },
  { id: 'd8711585-7f24-4ec1-b61a-21159b3d6c25', concepts: ['case-accusative', 'case-dative', 'verb-tenses'] },
  // bca27b32: keep verb-second (Obwohl clause fronts main clause = inversion)
  { id: 'bca27b32-e106-4788-8d0f-9c3e5b386e3b', concepts: ['modal-verbs', 'subordinate-clauses', 'verb-second', 'verb-tenses'] },
  { id: '0fffd586-ef58-4248-bf1c-f1ddde6f6d91', concepts: ['subordinate-clauses', 'verb-second'] },
  // 7d363325: GPT added modal-verbs but there's no modal; drop it
  { id: '7d363325-76ce-4744-a05e-bb276fb7a331', concepts: ['coordinating-conjunctions', 'reflexive-verbs'] },
  // f3d25669: add adjective-declension (ausländischen), don't add modal-verbs (no modal present)
  { id: 'f3d25669-cdf5-41e8-a58b-f78113ac4f8c', concepts: ['adjective-declension', 'case-dative'] },
  // eec55d25 Nachdem: keep verb-second, add verb-tenses
  { id: 'eec55d25-8967-4698-812a-b3f463dc7eff', concepts: ['subordinate-clauses', 'verb-second', 'verb-tenses'] },
  { id: '9ba11db1-2205-4465-aee8-8348e7580ad7', concepts: ['konjunktiv-i', 'modal-verbs', 'subordinate-clauses'] },
]

let ok = 0, fail = 0
for (const { id, concepts } of updates) {
  const { error } = await db.from('sentences').update({ concepts }).eq('id', id)
  if (error) {
    console.error(`FAIL ${id}: ${error.message}`)
    fail++
  } else {
    console.log(`OK   ${id.slice(0, 8)} → [${concepts.join(', ')}]`)
    ok++
  }
}

console.log(`\nDone: ${ok} updated, ${fail} failed`)
