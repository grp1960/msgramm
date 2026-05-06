import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/prompt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { sentence, language } = await req.json()

  if (!sentence || sentence.trim().length < 4) {
    return NextResponse.json({ error: 'Sentence too short' }, { status: 400 })
  }

  const text = sentence.trim()

  // Check cache first
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

  // Save to Supabase
  const { data, error } = await supabase
    .from('sentences')
    .insert({ language: language ?? 'de', text, breakdown })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json(data)
}
