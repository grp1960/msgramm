import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { withGuards, rateLimitGuard, heuristicGuard, llmGuard } from '@/lib/guards'
import { checkQuota, recordUsage } from '@/lib/quota'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export const POST = withGuards(
  rateLimitGuard({ limit: 100, windowSecs: 86400, keyPrefix: 'chat' }),
  heuristicGuard({ field: 'lastMessage' }),
  llmGuard({ field: 'lastMessage' }),
)(async (req: NextRequest): Promise<NextResponse> => {
  const { messages, sentence, userId } = await req.json()

  // Quota check — chat always consumes tokens (no cache)
  let quotaPeriodStart = ''
  if (userId) {
    const quota = await checkQuota(userId, 1500)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.expired ? 'PILOT_EXPIRED' : 'QUOTA_EXCEEDED', message: quota.reason, periodEnd: quota.periodEnd },
        { status: 429 },
      )
    }
    quotaPeriodStart = quota.periodStart
  }

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
      max_tokens: 800,
    })
    reply = response.choices[0].message
    usage = response.usage

    // Record actual token usage (always, including admins)
    if (userId) {
      const periodStart = quotaPeriodStart || new Date().toISOString().slice(0, 10)
      await recordUsage(userId, periodStart, usage?.total_tokens ?? 0)
    }
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
})
