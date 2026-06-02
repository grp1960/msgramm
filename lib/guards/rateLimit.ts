import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Guard, GuardContext } from './types'

// ─── Pluggable store interface ────────────────────────────────────────────────
// Swap in Upstash Redis or any other backend by implementing this interface.

export interface RateLimitStore {
  /** Increment the counter for key+window. Returns the new count. */
  increment(key: string, windowStart: Date): Promise<number>
}

// ─── Supabase store ───────────────────────────────────────────────────────────
// Requires a `rate_limits` table:
//   CREATE TABLE IF NOT EXISTS rate_limits (
//     key          text        NOT NULL,
//     window_start timestamptz NOT NULL,
//     count        int         NOT NULL DEFAULT 1,
//     PRIMARY KEY (key, window_start)
//   );
//
// Note: select-then-upsert has a small race window. A handful of extra
// requests slipping through at a window boundary is acceptable for this
// use case and avoids the need for a stored procedure.

export function supabaseRateLimitStore(
  url: string,
  serviceRoleKey: string,
): RateLimitStore {
  const client = createClient(url, serviceRoleKey)
  return {
    async increment(key, windowStart) {
      const { data } = await client
        .from('rate_limits')
        .select('count')
        .eq('key', key)
        .eq('window_start', windowStart.toISOString())
        .maybeSingle()

      if (!data) {
        await client.from('rate_limits').insert({
          key,
          window_start: windowStart.toISOString(),
          count: 1,
        })
        return 1
      }

      const newCount = data.count + 1
      await client
        .from('rate_limits')
        .update({ count: newCount })
        .eq('key', key)
        .eq('window_start', windowStart.toISOString())
      return newCount
    },
  }
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    req.headers.get('x-real-ip') ??
    'unknown'
  ).trim()
}

function getWindowStart(windowSecs: number): Date {
  const windowMs = windowSecs * 1000
  return new Date(Math.floor(Date.now() / windowMs) * windowMs)
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export type KeyByFn = (req: NextRequest, ctx: GuardContext) => string

export interface RateLimitOptions {
  /** Maximum requests allowed in the window. */
  limit: number
  /** Window size in seconds. Default: 86400 (1 day). */
  windowSecs?: number
  /** Prefix for the rate limit key. Use a different prefix per route. Default: 'rl'. */
  keyPrefix?: string
  /**
   * How to identify the caller.
   * 'ip'  — use the request IP (default)
   * fn    — custom function receiving (req, ctx); use ctx.userId if set by authGuard
   */
  keyBy?: 'ip' | KeyByFn
  /**
   * Store implementation. Defaults to supabaseRateLimitStore using env vars
   * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
   */
  store?: RateLimitStore
}

/**
 * Rate-limits requests by IP (default) or a custom key.
 * Backed by Supabase by default; swap the store for any other backend.
 */
export function rateLimitGuard(options: RateLimitOptions): Guard {
  const { limit, windowSecs = 86400, keyPrefix = 'rl', keyBy = 'ip', store: storeOption } = options

  // Lazy: create the default store on first request, not at module load time.
  // Avoids build-time failures when SUPABASE_SERVICE_ROLE_KEY is not set.
  let store: RateLimitStore | null = storeOption ?? null

  return async (req, ctx) => {
    if (!store) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!url || !key) {
        console.warn('[rateLimitGuard] SUPABASE_SERVICE_ROLE_KEY not set — rate limiting disabled')
        return null
      }
      store = supabaseRateLimitStore(url, key)
    }

    const identifier =
      typeof keyBy === 'function' ? keyBy(req, ctx) : getIP(req)

    const key = `${keyPrefix}:${identifier}`
    const windowStart = getWindowStart(windowSecs)

    const count = await store.increment(key, windowStart)

    if (count > limit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again tomorrow.' },
        { status: 429 },
      )
    }

    return null
  }
}
