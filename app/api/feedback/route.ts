import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withGuards, rateLimitGuard } from '@/lib/guards'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const POST = withGuards(
  rateLimitGuard({ limit: 20, windowSecs: 86400, keyPrefix: 'feedback' }),
)(async (req: NextRequest): Promise<NextResponse> => {
  const { scope, itemId, sentenceId, type, message, userId, email, mayFollowUp } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('feedback').insert({
    scope:          scope ?? 'general',
    item_id:        itemId ?? null,
    sentence_id:    sentenceId ?? null,
    type:           type ?? null,
    message:        message.trim(),
    user_id:        userId ?? null,
    email:          email ?? null,
    may_follow_up:  mayFollowUp ?? false,
  })

  if (error) {
    console.error('[feedback] Insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
