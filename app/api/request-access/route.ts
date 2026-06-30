import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withGuards, rateLimitGuard } from '@/lib/guards'

export const POST = withGuards(
  rateLimitGuard({ limit: 5, windowSecs: 86400, keyPrefix: 'request-access' }),
)(async (req: NextRequest): Promise<NextResponse> => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { userId, email } = await req.json()

  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing user info' }, { status: 400 })
  }

  // Upsert — idempotent; re-requesting resets requested_at but keeps pending status
  const { error } = await supabaseAdmin
    .from('access_requests')
    .upsert(
      { user_id: userId, email, status: 'pending', requested_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[request-access] Upsert failed:', error.message)
    return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
