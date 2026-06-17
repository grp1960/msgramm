import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a German grammar checker for a language learning app.

Analyse the sentence and return ONLY valid JSON in one of these three shapes:

1. Clean — no errors:
{"status": "clean"}

2. Has errors — fixable issues found:
{"status": "has_errors", "errors": [{"found": "exact text as written", "corrected": "corrected text", "why": "one plain-English phrase explaining the error"}], "corrected_sentence": "the full corrected sentence"}

3. Invalid — not a real German sentence:
{"status": "invalid", "message": "one helpful sentence explaining why"}

WHAT COUNTS AS AN ERROR (correct these):
- Wrong noun capitalisation (e.g. "der mann" → "der Mann")
- Missing or wrong umlauts written as digraphs (e.g. "ae" → "ä", "oe" → "ö", "ue" → "ü", "ss" where "ß" is standard)
- Obvious single-character typos that don't change meaning
- Wrong case ending (e.g. "Ich sehe der Mann" → "Ich sehe den Mann")
- Wrong verb agreement (e.g. "sie geht" correct, "sie gehen" when subject is singular → flag it)
- Wrong article gender (e.g. "der Frau" when nominative should be "die Frau")

WHAT TO IGNORE (do not flag as errors):
- Unusual but grammatically valid constructions
- Dialect forms or register choices
- Stylistic decisions (e.g. unusual word order that is still grammatical)
- Sentences that are simple or short — simplicity is not an error

INVALID (return status: invalid) only when:
- The input is not German at all
- The input is gibberish or random characters
- The input cannot be analysed as a sentence or meaningful fragment

Keep "why" explanations short and plain — no linguistics jargon. Say "direct object, so accusative" not "accusative case required by transitive verb governing NP".`

export async function POST(req: NextRequest) {
  const { sentence } = await req.json()
  if (!sentence || sentence.trim().length < 4) {
    return NextResponse.json({ status: 'invalid', message: 'Sentence too short.' })
  }

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: sentence.trim() },
      ],
      max_tokens: 400,
      temperature: 0,
    })
    const parsed = JSON.parse(res.choices[0].message.content ?? '{}')
    return NextResponse.json(parsed)
  } catch {
    // Fail open — if checker errors, let the breakdown proceed
    return NextResponse.json({ status: 'clean' })
  }
}
