import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Extract and validate the Bearer token from the Authorization header. */
export async function getSessionUser(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const { data: { user } } = await anonClient().auth.getUser(token)
  return user ?? null
}

/** Returns the user or a 401 NextResponse. */
export async function requireAuth(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user, response: null }
}

/** Returns true if the user has role=admin in profiles. */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient()
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role === 'admin'
}
