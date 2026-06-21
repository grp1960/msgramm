/**
 * Insert a single pre-validated sentence + breakdown into the database.
 * No GPT call — the breakdown JSON is provided directly.
 *
 * Usage:
 *   node scripts/insert-sentence.mjs
 *
 * Edit the SENTENCE object below, then run the script.
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Edit this object for each sentence ───────────────────────────────────────

const SENTENCE = {
  language: 'German',
  text: 'Was zunächst wie eine rein operative Neuausrichtung der Abteilungen erscheint, könnte sich langfristig als Voraussetzung für die strategische Handlungsfähigkeit des gesamten Unternehmens erweisen.',
  difficulty: 'Expert',
  concepts: ['konjunktiv-ii', 'subordinate-clauses', 'reflexive-verbs', 'case-accusative', 'case-genitive', 'adjective-declension', 'verb-second'],
  tags: [],
  ctx_before: null,
  ctx_after: null,
  ctx_before_translation: null,
  ctx_after_translation: null,
  breakdown: {
    translation: "What initially appears to be a purely operational realignment of the departments could prove in the long run to be a prerequisite for the strategic capacity of the entire company.",
    explanation: "The sentence contrasts surface appearance with long-term consequence. The was-clause (a free relative clause acting as subject) establishes what something looks like; the main clause reframes it. Sich erweisen als is the key idiomatic expression: to prove to be / to turn out to be. Könnte (Konjunktiv II) introduces precision — not will, but could — making the reframing a judgment rather than a claim.",
    trap: "Als after sich erweisen does not take the accusative — the noun following als is in the nominative (predicate nominative). Voraussetzung is nominative, not accusative. Learners frequently reach for the accusative after als by analogy with other constructions.",
    words: [
      { wid: 1, word: "Was", type: "Pronoun", translation: "what", case: "Nominative", job: "Free relative pronoun introducing a nominal clause that acts as the subject of the main clause. Was = that which / what.", note: "This is not an interrogative was. It is a relative pronoun with no explicit antecedent — the clause as a whole is the subject." },
      { wid: 2, word: "zunächst", type: "Adverb", translation: "initially / at first", job: "Establishes that the appearance is preliminary. Crucial to the reframing — what seems true now may prove to be something else over time." },
      { wid: 3, word: "wie", type: "Conjunction", translation: "like / as", job: "Comparative conjunction introducing the predicate of erscheinen — the thing the subject resembles.", note: "Erscheinen wie = to appear as / to look like. The wie-phrase names the appearance being questioned." },
      { wid: 4, word: "eine", type: "Article", translation: "a", case: "Nominative", gender: "Feminine", job: "Indefinite article within the wie-phrase, for the noun Neuausrichtung.", form: "ein" },
      { wid: 5, word: "rein", type: "Adverb", translation: "purely / merely", job: "Modifies operative, intensifying the sense that the realignment is only operational — nothing more, apparently. Sets up the contrast with the strategic consequence revealed in the main clause." },
      { wid: 6, word: "operative", type: "Adjective", translation: "operational", case: "Nominative", gender: "Feminine", number: "Singular", job: "Modifies Neuausrichtung. Mixed nominative feminine ending -e after indefinite article.", form: "operativ" },
      { wid: 7, word: "Neuausrichtung", type: "Noun", translation: "realignment", case: "Nominative", gender: "Feminine", number: "Singular", job: "Predicate of the wie-phrase — what the thing appears to be on the surface.", form: "die Neuausrichtung" },
      { wid: 8, word: "der", type: "Article", translation: "of the", case: "Genitive", number: "Plural", job: "Definite article for the genitive plural Abteilungen.", form: "die" },
      { wid: 9, word: "Abteilungen", type: "Noun", translation: "departments", case: "Genitive", gender: "Feminine", number: "Plural", job: "Genitive modifier of Neuausrichtung — specifies which departments are involved.", form: "die Abteilung" },
      { wid: 10, word: "erscheint", type: "Verb", translation: "appears", tense: "Present", person: "3rd singular", job: "Finite verb of the was-clause (erscheinen = to appear, to seem). Positioned at the end of the subordinate clause.", form: "erscheinen" },
      { wid: 11, word: ",", type: "Punctuation", job: "Separates the subject clause from the main clause." },
      { wid: 12, word: "könnte", type: "Verb", translation: "could", tense: "Konjunktiv II", person: "3rd singular", job: "Modal verb (können) in Konjunktiv II. Expresses possibility with deliberate hedging — the speaker is making a judgment, not stating a fact. This precision is what marks the sentence as Expert.", form: "können", note: "Könnte rather than wird or kann is a conscious choice. It signals: this is a considered judgment under uncertainty, not a prediction." },
      { wid: 13, word: "sich", type: "Pronoun", translation: "[reflexive]", case: "Accusative", job: "Reflexive pronoun required by the verb sich erweisen (to prove to be / to turn out to be). The verb is inseparably reflexive.", form: "sich" },
      { wid: 14, word: "langfristig", type: "Adverb", translation: "in the long run", job: "Contrasts with zunächst (wid 2). The temporal pair is the backbone of the reframing: initially X, but in the long run Y." },
      { wid: 15, word: "als", type: "Conjunction", translation: "as / to be", job: "Part of the fixed expression sich erweisen als (to prove to be). Introduces the predicate nominative.", note: "After sich erweisen als, the following noun is nominative — not accusative. Voraussetzung (wid 16) is nominative." },
      { wid: 16, word: "Voraussetzung", type: "Noun", translation: "prerequisite", case: "Nominative", gender: "Feminine", number: "Singular", job: "Predicate nominative after sich erweisen als — what the thing proves to be in the long run. The reframed identity of the realignment.", form: "die Voraussetzung" },
      { wid: 17, word: "für", type: "Preposition", translation: "for", job: "Accusative preposition. Voraussetzung für = prerequisite for. Introduces what the prerequisite enables.", note: "Voraussetzung always takes für + accusative." },
      { wid: 18, word: "die", type: "Article", translation: "the", case: "Accusative", gender: "Feminine", job: "Definite article for the accusative noun Handlungsfähigkeit, governed by für.", form: "die" },
      { wid: 19, word: "strategische", type: "Adjective", translation: "strategic", case: "Accusative", gender: "Feminine", number: "Singular", job: "Modifies Handlungsfähigkeit. Weak accusative feminine ending -e. Contrasts with operative (wid 6) — the surface level was operational, the consequence is strategic.", form: "strategisch" },
      { wid: 20, word: "Handlungsfähigkeit", type: "Noun", translation: "capacity to act / strategic capacity", case: "Accusative", gender: "Feminine", number: "Singular", job: "Object of für — the capability the realignment enables. A compound noun: Handlung (action) + Fähigkeit (capacity/ability).", form: "die Handlungsfähigkeit", note: "Handlungsfähigkeit is a formal term from organizational and political discourse. It means the ability of an entity to take effective, directed action." },
      { wid: 21, word: "des", type: "Article", translation: "of the", case: "Genitive", gender: "Neuter", job: "Definite article for the genitive noun Unternehmens.", form: "das" },
      { wid: 22, word: "gesamten", type: "Adjective", translation: "entire", case: "Genitive", gender: "Neuter", number: "Singular", job: "Modifies Unternehmens. Weak genitive ending -en after the definite article. Signals company-wide scope — the strategic consequence is not limited to the departments mentioned earlier.", form: "gesamt" },
      { wid: 23, word: "Unternehmens", type: "Noun", translation: "company", case: "Genitive", gender: "Neuter", number: "Singular", job: "Genitive modifier of Handlungsfähigkeit — whose strategic capacity is at stake.", form: "das Unternehmen" },
      { wid: 24, word: "erweisen", type: "Verb", translation: "prove to be", job: "Infinitive of sich erweisen. Lexical verb of the main clause, positioned at the end and governed by könnte.", form: "erweisen" }
    ]
  },
}

// ──────────────────────────────────────────────────────────────────────────────

async function run() {
  const { text, language } = SENTENCE

  if (!SENTENCE.breakdown?.words?.length) {
    console.error('✗ breakdown.words is empty — paste the validated breakdown JSON before running.')
    process.exit(1)
  }

  const { data: existing } = await supabase
    .from('sentences')
    .select('id')
    .eq('text', text)
    .eq('language', language)
    .maybeSingle()

  if (existing) {
    console.error(`✗ Sentence already exists in DB (id: ${existing.id}). Aborting.`)
    process.exit(1)
  }

  const { data, error } = await supabase
    .from('sentences')
    .insert({
      language,
      text,
      difficulty: SENTENCE.difficulty,
      concepts: SENTENCE.concepts ?? [],
      tags: SENTENCE.tags ?? [],
      ctx_before: SENTENCE.ctx_before ?? null,
      ctx_after: SENTENCE.ctx_after ?? null,
      ctx_before_translation: SENTENCE.ctx_before_translation ?? null,
      ctx_after_translation: SENTENCE.ctx_after_translation ?? null,
      breakdown: SENTENCE.breakdown,
      needs_refresh: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('✗ Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Inserted: ${data.id}`)
  console.log(`  "${text.slice(0, 60)}..."`)
  console.log(`  Difficulty: ${SENTENCE.difficulty}`)
  console.log(`  Concepts:   ${(SENTENCE.concepts ?? []).join(', ')}`)
}

run().catch(console.error)
