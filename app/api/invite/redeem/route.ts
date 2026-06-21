import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Missing invite code.' }, { status: 400 })

  const userId = user!.id
  const db = getAdminClient()
  const normalised = (code as string).trim().toUpperCase()

  const { data: invite, error: inviteError } = await db
    .from('invite_codes')
    .select('*')
    .eq('code', normalised)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid invite code.' }, { status: 400 })
  }

  if (invite.uses_count >= invite.max_uses) {
    return NextResponse.json({ error: 'This invite code has already been used the maximum number of times.' }, { status: 400 })
  }

  const { data: profile } = await db
    .from('profiles')
    .select('license_type, expires_at')
    .eq('user_id', userId)
    .single()

  if (profile?.license_type) {
    return NextResponse.json({ error: 'You have already activated an invite code.' }, { status: 400 })
  }

  const today = new Date()
  const expiresAt = new Date(today.getTime() + invite.pilot_days * 86_400_000)
    .toISOString()
    .slice(0, 10)

  const { error: profileError } = await db
    .from('profiles')
    .update({
      license_type: invite.license_type,
      expires_at: expiresAt,
      subscription_start: today.toISOString().slice(0, 10),
      subscription_interval_days: invite.pilot_days,
    })
    .eq('user_id', userId)

  if (profileError) {
    return NextResponse.json({ error: 'Failed to activate code. Please try again.' }, { status: 500 })
  }

  await db
    .from('invite_codes')
    .update({ uses_count: invite.uses_count + 1 })
    .eq('code', normalised)

  return NextResponse.json({ ok: true, expiresAt })
}
