import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function POST(req: NextRequest) {
  const { messages, sentence, userId } = await req.json()

  // Fetch active system prompt from DB
  const { data: promptData } = await supabaseAdmin
    .from('system_prompts')
    .select('content')
    .eq('name', 'Language Chat')
    .eq('active', true)
    .single()

  const basePrompt = promptData?.content ?? 'You are a language learning assistant.'

  // Append sentence context
  const systemPrompt = sentence
    ? `${basePrompt}\n\nCurrent sentence being studied:\nLanguage: ${sentence.language}\nText: ${sentence.text}\nTranslation: ${sentence.breakdown?.translation ?? ''}`
    : basePrompt

  // Call OpenAI
  let reply, usage
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
    })
    reply = response.choices[0].message
    usage = response.usage
  } catch {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 })
  }

  // Save exchange to DB if user is logged in
  if (userId && sentence?.id) {
    const userMessage = messages[messages.length - 1]
    await supabaseAdmin.from('chat_messages').insert([
      {
        user_id: userId,
        sentence_id: sentence.id,
        role: 'user',
        content: userMessage.content,
        prompt_tokens: usage?.prompt_tokens ?? 0,
        completion_tokens: 0,
      },
      {
        user_id: userId,
        sentence_id: sentence.id,
        role: 'assistant',
        content: reply.content,
        prompt_tokens: 0,
        completion_tokens: usage?.completion_tokens ?? 0,
      },
    ])
  }

  return NextResponse.json({
    content: reply.content,
    usage: {
      prompt_tokens: usage?.prompt_tokens ?? 0,
      completion_tokens: usage?.completion_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
    },
  })
}
