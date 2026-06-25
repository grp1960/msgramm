/**
 * Quota system for Ms. Gramm
 *
 * Quota precedence (highest wins):
 *   1. profiles.role = 'admin'           → always pass
 *   2. profiles.token_limit_override     → use this value
 *   3. license_types.monthly_token_limit → use license default
 *
 * Usage period: rolling window from profiles.subscription_start
 * every profiles.subscription_interval_days days.
 */

import { createClient } from '@supabase/supabase-js'

// Admin client — needs service role to read profiles and write token_usage
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Period helpers ────────────────────────────────────────────────────────

/**
 * Returns the ISO date string (YYYY-MM-DD) for the start of the user's
 * current billing period, given their subscription_start and interval.
 */
export function currentPeriodStart(
  subscriptionStart: string,
  intervalDays: number,
): string {
  const start = new Date(subscriptionStart)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const msPerDay = 86_400_000
  const daysSinceStart = Math.floor(
    (today.getTime() - start.getTime()) / msPerDay,
  )
  const periodNumber = Math.floor(daysSinceStart / intervalDays)
  const periodStartMs =
    start.getTime() + periodNumber * intervalDays * msPerDay
  return new Date(periodStartMs).toISOString().slice(0, 10)
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type QuotaStatus =
  | { allowed: true; tokensUsed: number; limit: number; periodStart: string }
  | { allowed: false; expired: true; expiresAt: string; tokensUsed: number; limit: number; periodStart: string; periodEnd: string; reason: string }
  | { allowed: false; expired?: false; tokensUsed: number; limit: number; periodStart: string; periodEnd: string; reason: string }

// ─── Check quota ───────────────────────────────────────────────────────────

/**
 * Checks whether a user has quota remaining for an estimated token spend.
 * Returns QuotaStatus — caller decides how to respond.
 *
 * Pass estimatedTokens = 0 to just read current usage without blocking.
 */
export async function checkQuota(
  userId: string,
  estimatedTokens: number,
): Promise<QuotaStatus> {
  const db = getAdminClient()

  // 1. Load profile + license type in one join
  const { data: profile, error: profileError } = await db
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

  if (profileError || !profile) {
    // No profile → treat as basic user with no quota (block)
    console.warn(`[quota] No profile found for user ${userId}`)
    return {
      allowed: false,
      tokensUsed: 0,
      limit: 0,
      periodStart: '',
      periodEnd: '',
      reason: 'No user profile found.',
    }
  }

  // 2. Admin role → always pass
  if (profile.role === 'admin') {
    return { allowed: true, tokensUsed: 0, limit: 999_999_999, periodStart: '' }
  }

  // 3a. Pilot expiry check
  if (profile.expires_at) {
    const today = new Date().toISOString().slice(0, 10)
    if (today >= profile.expires_at) {
      return {
        allowed: false,
        expired: true,
        expiresAt: profile.expires_at,
        tokensUsed: 0,
        limit: 0,
        periodStart: '',
        periodEnd: '',
        reason: 'Your pilot access has ended. Thank you for being part of the Ms. Gramm pilot!',
      }
    }
  }

  // 3. Resolve limit
  const licenseLimit =
    (profile.license_types as any)?.monthly_token_limit ?? 0
  const limit: number = profile.token_limit_override ?? licenseLimit

  // 4. Resolve period start
  const subscriptionStart: string =
    profile.subscription_start ?? new Date().toISOString().slice(0, 10)
  const intervalDays: number = profile.subscription_interval_days ?? 30
  const periodStart = currentPeriodStart(subscriptionStart, intervalDays)

  // 5. Read current usage for this period
  const { data: usage } = await db
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('period_start', periodStart)
    .single()

  const tokensUsed = usage?.tokens_used ?? 0

  const periodEndMs =
    new Date(periodStart).getTime() + intervalDays * 86_400_000
  const periodEnd = new Date(periodEndMs).toISOString().slice(0, 10)

  if (tokensUsed + estimatedTokens > limit) {
    return {
      allowed: false,
      tokensUsed,
      limit,
      periodStart,
      periodEnd,
      reason: `You've used up your sentences for this month. Your allowance resets on ${periodEnd}.`,
    }
  }

  return { allowed: true, tokensUsed, limit, periodStart }
}

// ─── Record usage ──────────────────────────────────────────────────────────

/**
 * Upserts actual token usage for a user after an OpenAI call completes.
 * Safe to call even if the user is admin (no-op for missing profile rows).
 */
export async function recordUsage(
  userId: string,
  periodStart: string,
  tokens: number,
): Promise<void> {
  if (!periodStart) return // admin path — no period, nothing to record
  const db = getAdminClient()
  const { error } = await db.rpc('increment_token_usage', {
    p_user_id: userId,
    p_period_start: periodStart,
    p_tokens: tokens,
  })
  if (error) {
    console.error('[quota] Failed to record token usage:', error.message)
  }
}
