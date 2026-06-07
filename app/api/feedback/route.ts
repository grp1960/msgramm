import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withGuards, rateLimitGuard } from '@/lib/guards'

export const POST = withGuards(
  rateLimitGuard({ limit: 20, windowSecs: 86400, keyPrefix: 'feedback' }),
)(async (req: NextRequest): Promise<NextResponse> => {
  // Client created at request time — service role key not available during build
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { scope, itemId, sentenceId, type, message, userId, email, mayFollowUp, severity, sentenceText, breakdownSnapshot } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('feedback').insert({
    scope:              scope ?? 'general',
    item_id:            itemId ?? null,
    sentence_id:        sentenceId ?? null,
    type:               type ?? null,
    message:            message.trim(),
    user_id:            userId ?? null,
    email:              email ?? null,
    may_follow_up:      mayFollowUp ?? false,
    severity:           severity ?? 'medium',
    sentence_text:      sentenceText ?? null,
    breakdown_snapshot: breakdownSnapshot ?? null,
  })

  if (error) {
    console.error('[feedback] Insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
