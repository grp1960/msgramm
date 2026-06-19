/**
 * quotaGuard — checks user token quota before allowing an API call.
 *
 * Requires the request body to include { userId } (string | null).
 * Unauthenticated requests (userId = null) are blocked — caller must
 * require sign-in before reaching this guard.
 *
 * estimatedTokens: conservative upper-bound for the operation type.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkQuota } from '@/lib/quota'
import type { Guard, GuardContext } from './types'

export interface QuotaGuardOptions {
  /** Conservative token estimate for this operation (prompt + completion) */
  estimatedTokens: number
}

export function quotaGuard(options: QuotaGuardOptions): Guard {
  return async (req: NextRequest, ctx: GuardContext): Promise<NextResponse | null> => {
    // Clone and parse body (body can only be read once — route handler reads it again)
    const body = await req.clone().json().catch(() => ({}))
    const userId: string | null = body.userId ?? null

    if (!userId) {
      return NextResponse.json(
        { error: 'QUOTA_AUTH_REQUIRED', message: 'Sign in to use this feature.' },
        { status: 401 },
      )
    }

    const status = await checkQuota(userId, options.estimatedTokens)

    if (!status.allowed) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: status.reason, periodEnd: status.periodEnd },
        { status: 429 },
      )
    }

    // Pass period start through context so route handler can call recordUsage
    // without re-fetching the profile
    ctx.quotaPeriodStart = status.periodStart
    ctx.quotaUserId = userId

    return null // pass
  }
}
