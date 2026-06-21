import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { withGuards, rateLimitGuard, heuristicGuard, llmGuard } from '@/lib/guards'
import { checkQuota, recordUsage } from '@/lib/quota'
import { requireAuth } from '@/lib/auth'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 2000
const ALLOWED_ROLES = new Set(['user', 'assistant'])

export const POST = withGuards(
  rateLimitGuard({ limit: 100, windowSecs: 86400, keyPrefix: 'chat' }),
  heuristicGuard({ field: 'lastMessage' }),
  llmGuard({ field: 'lastMessage' }),
)(async (req: NextRequest): Promise<NextResponse> => {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const { messages, sentence, lastMessage } = await req.json()

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid messages.' }, { status: 400 })
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: 'Too many messages.' }, { status: 400 })
  }
  for (const m of messages) {
    if (!ALLOWED_ROLES.has(m?.role)) return NextResponse.json({ error: 'Invalid message role.' }, { status: 400 })
    if (typeof m?.content !== 'string' || m.content.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: 'Message too long.' }, { status: 400 })
    }
  }

  const userId = user!.id

  const quota = await checkQuota(userId, 1500)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.expired ? 'PILOT_EXPIRED' : 'QUOTA_EXCEEDED', message: quota.reason, periodEnd: quota.periodEnd },
      { status: 429 },
    )
  }

  // Fetch active system prompt from DB
  const { data: promptData } = await supabaseAdmin
    .from('system_prompts')
    .select('content')
    .eq('name', 'Language Chat')
    .eq('active', true)
    .single()

  const basePrompt = promptData?.content ?? 'You are a language learning assistant.'

  const systemPrompt = sentence
    ? `${basePrompt}\n\nCurrent sentence being studied:\nLanguage: ${sentence.language}\nText: ${sentence.text}\nTranslation: ${sentence.breakdown?.translation ?? ''}`
    : basePrompt

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

    const periodStart = quota.periodStart || new Date().toISOString().slice(0, 10)
    await recordUsage(userId, periodStart, usage?.total_tokens ?? 0)
  } catch {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 })
  }

  if (sentence?.id) {
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
