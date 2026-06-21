import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/prompt'
import { withGuards, heuristicGuard, rateLimitGuard, llmGuard } from '@/lib/guards'
import { checkQuota, recordUsage } from '@/lib/quota'
import { requireAuth, isAdmin } from '@/lib/auth'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Approved word types ───────────────────────────────────────────────────
const APPROVED_TYPES = new Set([
  'Pronoun', 'Verb', 'Helper verb', 'Modal verb', 'Noun',
  'Article', 'Article contraction', 'Preposition', 'Reason connector',
  'Condition opener', 'Negation', 'Pointing word', 'Time word',
  'Conjunction', 'Adverb', 'Adjective', 'Punctuation',
])

// ─── Output schema validator ───────────────────────────────────────────────
function validateBreakdown(obj: any): { valid: boolean; reason: string } {
  if (!obj || typeof obj !== 'object') return { valid: false, reason: 'not an object' }
  if (!Array.isArray(obj.words) || obj.words.length === 0) return { valid: false, reason: 'words array missing or empty' }
  if (typeof obj.translation !== 'string') return { valid: false, reason: 'translation missing' }
  if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(obj.difficulty)) return { valid: false, reason: `bad difficulty: ${obj.difficulty}` }
  if (!Array.isArray(obj.tags)) return { valid: false, reason: 'tags not an array' }
  for (const w of obj.words) {
    if (typeof w.wid !== 'number') return { valid: false, reason: 'word missing wid' }
    if (typeof w.word !== 'string' || !w.word) return { valid: false, reason: `word ${w.wid} missing word string` }
    if (!APPROVED_TYPES.has(w.type)) return { valid: false, reason: `unknown type: "${w.type}"` }
  }
  return { valid: true, reason: 'ok' }
}

// ─── Guard chain ───────────────────────────────────────────────────────────
const llm = llmGuard()

export const POST = withGuards(
  heuristicGuard(),
  rateLimitGuard({ limit: 20, windowSecs: 86400, keyPrefix: 'breakdown' }),
)(async (req: NextRequest): Promise<NextResponse> => {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const { sentence, language, original_id, original_language, force } = await req.json()

  if (!sentence || sentence.trim().length < 4) {
    return NextResponse.json({ error: 'Sentence too short' }, { status: 400 })
  }

  const text = sentence.trim()

  const wordCount = text.split(/\s+/).length
  if (wordCount > 40) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: 'This sentence is too long to analyse. Please enter a sentence of 40 words or fewer.' },
      { status: 422 },
    )
  }

  // force is admin-only — allows refreshing a cached breakdown
  const userId = user!.id
  const adminUser = force ? await isAdmin(userId) : false
  const useForce = force && adminUser

  // 1. Cache check
  if (!useForce) {
    const { data: cached } = await supabase
      .from('sentences')
      .select('*')
      .eq('text', text)
      .eq('language', language ?? 'de')
      .limit(1)
      .single()

    if (cached) return NextResponse.json(cached)
  }

  // 2. Quota check (only for new, uncached sentences)
  const quota = await checkQuota(userId, 2500)
  if (!quota.allowed) {
    const error = quota.expired ? 'PILOT_EXPIRED' : 'QUOTA_EXCEEDED'
    return NextResponse.json(
      { error, message: quota.reason, periodEnd: quota.periodEnd },
      { status: 429 },
    )
  }
  const quotaPeriodStart = quota.periodStart

  // 3. LLM content guard
  const guardReq = new Request(req.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sentence: text }),
  }) as NextRequest

  const rejection = await llm(guardReq, {})
  if (rejection) return rejection as NextResponse

  // 4. Generate breakdown
  let breakdown
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Language: ${language ?? 'German'}\nSentence: ${text}` },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    })
    breakdown = JSON.parse(response.choices[0].message.content ?? '{}')

    const periodStart = quotaPeriodStart || new Date().toISOString().slice(0, 10)
    await recordUsage(userId, periodStart, response.usage?.total_tokens ?? 0)
  } catch {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 })
  }

  // 5a. Check for language/validity rejection from the model
  if (breakdown.error === 'invalid_input') {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: breakdown.message ?? 'Please enter a valid sentence in the selected language.' },
      { status: 422 }
    )
  }

  // 5b. Validate output schema
  const { valid, reason } = validateBreakdown(breakdown)
  if (!valid) {
    console.error(`[breakdown] Output validation failed for "${text}": ${reason}`)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }

  const difficulty = breakdown.difficulty ?? 'Intermediate'
  const tags = Array.isArray(breakdown.tags) ? breakdown.tags : []

  // 6. Save to DB
  const row: Record<string, unknown> = { breakdown, difficulty, tags, needs_refresh: false }
  if (original_id) row.original_id = original_id
  if (original_language) row.original_language = original_language

  let data, error
  if (useForce) {
    const result = await supabase
      .from('sentences')
      .update(row)
      .eq('text', text)
      .eq('language', language ?? 'de')
      .select()
      .single()
    data = result.data
    error = result.error
  } else {
    const result = await supabase
      .from('sentences')
      .insert({ language: language ?? 'de', text, ...row })
      .select()
      .single()
    data = result.data
    error = result.error
  }

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ ...data, _newly_created: !useForce })
})
