import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { currentPeriodStart } from '@/lib/quota'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req)
  if (!user) return response!
  const userId = user.id

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await db
    .from('profiles')
    .select(`
      role,
      license_type,
      token_limit_override,
      subscription_start,
      subscription_interval_days,
      expires_at,
      license_types ( monthly_token_limit )
    `)
    .eq('user_id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 404 })

  const isAdmin = profile.role === 'admin'
  const licenseLimit = (profile.license_types as any)?.monthly_token_limit ?? 0
  const limit: number = profile.token_limit_override ?? licenseLimit

  const subscriptionStart: string = profile.subscription_start ?? new Date().toISOString().slice(0, 10)
  const intervalDays: number = profile.subscription_interval_days ?? 30
  const periodStart = currentPeriodStart(subscriptionStart, intervalDays)
  const periodEnd = new Date(new Date(periodStart).getTime() + intervalDays * 86_400_000).toISOString().slice(0, 10)

  let tokensUsed = 0
  if (!isAdmin && limit > 0) {
    const { data: usage } = await db
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .single()
    tokensUsed = usage?.tokens_used ?? 0
  }

  return NextResponse.json({
    licenseType: profile.license_type ?? null,
    role: profile.role,
    expiresAt: profile.expires_at ?? null,
    periodEnd,
    tokensUsed,
    limit,
    isAdmin,
  })
}
