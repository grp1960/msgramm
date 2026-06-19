import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const { code, userId } = await req.json()

  if (!code || !userId) {
    return NextResponse.json({ error: 'Missing code or userId.' }, { status: 400 })
  }

  const db = getAdminClient()
  const normalised = (code as string).trim().toUpperCase()

  // 1. Find the invite code
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

  // 2. Check user hasn't already redeemed a code
  const { data: profile } = await db
    .from('profiles')
    .select('license_type, expires_at')
    .eq('user_id', userId)
    .single()

  if (profile?.license_type) {
    return NextResponse.json({ error: 'You have already activated an invite code.' }, { status: 400 })
  }

  // 3. Compute expiry
  const today = new Date()
  const expiresAt = new Date(today.getTime() + invite.pilot_days * 86_400_000)
    .toISOString()
    .slice(0, 10)

  // 4. Update profile
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

  // 5. Increment uses_count
  await db
    .from('invite_codes')
    .update({ uses_count: invite.uses_count + 1 })
    .eq('code', normalised)

  return NextResponse.json({ ok: true, expiresAt })
}
