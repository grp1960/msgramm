/**
 * Import paired sentences into Ms. Gramm.
 * Each pair has a primary language sentence and one or more translations.
 * Primary is imported first; translations are linked via original_id.
 *
 * Usage:
 *   node scripts/import-sentences.mjs
 */

const BASE_URL = 'https://msgramm.vercel.app'
const DELAY_MS = 1500

// Each entry: { primary: { lang, text }, translations: [{ lang, text }] }
const PAIRS = [
  {
    primary: { lang: 'de', text: 'Die Frau, die an der Bushaltestelle wartet, ist eine bemerkenswerte Lehrerin.' },
    translations: [{ lang: 'la', text: 'Femina, quae ad stationem vehiculorum exspectat, est magistra admirabilis.' }],
  },
  {
    primary: { lang: 'de', text: 'Der Hund des Nachbarn ist schneller als unser Hund, aber sein Verhalten ist oft widersprüchlich.' },
    translations: [{ lang: 'la', text: 'Canis vicini celerior est cane nostro, sed mores eius saepe sunt discrepantes.' }],
  },
  {
    primary: { lang: 'de', text: 'Er sagt, dass er den Arzt um eine Klarstellung bezüglich der Nuance der Diagnose seiner Schwester bitten muss.' },
    translations: [{ lang: 'la', text: 'Dicit se medicum de interpretatione subtilitatis diagnosio sororis suae rogare debere.' }],
  },
  {
    primary: { lang: 'de', text: 'Ich habe mein Zimmer heute schon aufgeräumt, was eine bemerkenswerte Veränderung gegenüber meiner üblichen Routine ist.' },
    translations: [{ lang: 'la', text: 'Cubiculum meum hodie iam purgavi, quae res est mutatio admirabilis a consuetudine mea.' }],
  },
  {
    primary: { lang: 'de', text: 'Wenn ich reich wäre, würde ich das große Haus kaufen und jemanden einstellen, der mir jede sprachliche Nuance erklärt.' },
    translations: [{ lang: 'la', text: 'Si dives essem, domum magnam emerem et aliquem conducerem qui mihi omnes subtilitates linguarum explicaret.' }],
  },
  {
    primary: { lang: 'de', text: 'Ihr wird von ihrem Freund geholfen, weil die Anweisungen für das Projekt widersprüchlich waren.' },
    translations: [{ lang: 'la', text: 'Ab amico eius adiuvatur, quod praecepta operis erant discrepantia.' }],
  },
  {
    primary: { lang: 'de', text: 'Du solltest die Schlüssel nicht auf den Tisch legen, ohne eine Klarstellung darüber abzugeben, wo sie hingehören.' },
    translations: [{ lang: 'la', text: 'Claves super mensam ponere non debes sine interpretatione de loco quo pertinent.' }],
  },
  {
    primary: { lang: 'de', text: 'Ich wasche mich, bevor ich ins Bett gehe, weil die Hitze heute wirklich bemerkenswert war.' },
    translations: [{ lang: 'la', text: 'Me lavo antequam cubitum eo, quod calor hodie vere admirabilis fuit.' }],
  },
  {
    primary: { lang: 'de', text: 'Ohne einen Mantel ist es draußen zu kalt, was widersprüchlich erscheint, da es vor einer Stunde noch warm war.' },
    translations: [{ lang: 'la', text: 'Sine gausapa foris nimis frigidum est, quod discrepans videtur cum ante horam caleret.' }],
  },
  {
    primary: { lang: 'de', text: 'Gib mir das Buch, das auf dem Stuhl liegt, damit ich eine Klarstellung für diese spezifische Nuance finden kann.' },
    translations: [{ lang: 'la', text: 'Da mihi librum qui in sella iacet, ut interpretationem huius subtilitatis propriae inveniam.' }],
  },
]

async function importSentence(text, language, extra = {}) {
  const res = await fetch(`${BASE_URL}/api/breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence: text, language, ...extra }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  const total = PAIRS.reduce((n, p) => n + 1 + p.translations.length, 0)
  console.log(`Importing ${PAIRS.length} pairs (${total} sentences total)...\n`)

  for (const [i, pair] of PAIRS.entries()) {
    const { primary, translations } = pair
    process.stdout.write(`[${i + 1}/${PAIRS.length}] ${primary.lang.toUpperCase()}: ${primary.text.slice(0, 55)}... `)
    let primaryData
    try {
      primaryData = await importSentence(primary.text, primary.lang)
      console.log(`✓ ${primaryData.difficulty}`)
    } catch (e) {
      console.log(`✗ ${e.message}`)
      await sleep(DELAY_MS)
      continue
    }

    for (const t of translations) {
      await sleep(DELAY_MS)
      process.stdout.write(`         ${t.lang.toUpperCase()}: ${t.text.slice(0, 55)}... `)
      try {
        const data = await importSentence(t.text, t.lang, {
          original_id: primaryData.id,
          original_language: primary.lang,
        })
        console.log(`✓ ${data.difficulty}`)
      } catch (e) {
        console.log(`✗ ${e.message}`)
      }
    }

    if (i < PAIRS.length - 1) await sleep(DELAY_MS)
  }

  console.log('\nDone.')
}

run()
