import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const { userId, first_name, last_name, username, display_name } = await req.json()

  if (!userId) return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })

  const db = getAdminClient()

  // Check username isn't already taken
  if (username) {
    const { data: existing } = await db
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .neq('user_id', userId)
      .single()
    if (existing) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
    }
  }

  const { error } = await db
    .from('profiles')
    .update({ first_name, last_name, username, display_name, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
