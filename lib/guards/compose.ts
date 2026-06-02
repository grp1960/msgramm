import { NextRequest, NextResponse } from 'next/server'
import type { Guard, GuardContext, RouteHandler } from './types'

/**
 * Wraps a route handler with an ordered list of guards.
 * Guards run in sequence; the first rejection short-circuits the chain.
 * A shared ctx object flows through all guards so earlier guards can
 * pass data to later ones (e.g. resolved userId).
 *
 * Usage:
 *   export const POST = withGuards(
 *     heuristicGuard(),
 *     rateLimitGuard({ limit: 20, windowSecs: 86400, keyPrefix: 'breakdown' }),
 *   )(async (req) => { ... })
 */
export function withGuards(...guards: Guard[]) {
  return (handler: RouteHandler) =>
    async (req: NextRequest): Promise<NextResponse> => {
      const ctx: GuardContext = {}
      try {
        for (const guard of guards) {
          const result = await guard(req, ctx)
          if (result) return result
        }
        return await handler(req)
      } catch (err) {
        console.error('[withGuards] unhandled error:', err)
        return NextResponse.json(
          { error: (err instanceof Error ? err.message : String(err)) || 'Internal server error' },
          { status: 500 },
        )
      }
    }
}
