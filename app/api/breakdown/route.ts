import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/prompt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { sentence, language, original_id, original_language, force } = await req.json()

  if (!sentence || sentence.trim().length < 4) {
    return NextResponse.json({ error: 'Sentence too short' }, { status: 400 })
  }

  const text = sentence.trim()

  // Check cache (skip if force=true)
  if (!force) {
    const { data: cached } = await supabase
      .from('sentences')
      .select('*')
      .eq('text', text)
      .eq('language', language ?? 'de')
      .limit(1)
      .single()

    if (cached) {
      return NextResponse.json(cached)
    }
  }

  // Call OpenAI
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
    })
    breakdown = JSON.parse(response.choices[0].message.content ?? '{}')
  } catch (e) {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 })
  }

  const difficulty = breakdown.difficulty ?? 'Intermediate'
  const tags = Array.isArray(breakdown.tags) ? breakdown.tags : []

  // Update existing row if force, otherwise insert
  const row: Record<string, unknown> = { breakdown, difficulty, tags, needs_refresh: false }
  if (original_id) row.original_id = original_id
  if (original_language) row.original_language = original_language

  let data, error
  if (force) {
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

  return NextResponse.json(data)
}
