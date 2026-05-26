import { NextRequest, NextResponse } from 'next/server'

export type GuardContext = Record<string, unknown>

/**
 * A guard returns null to pass, or a NextResponse to reject.
 * ctx is shared across all guards in a chain and can carry
 * data forward (e.g. userId set by authGuard, read by rateLimitGuard).
 */
export type Guard = (req: NextRequest, ctx: GuardContext) => Promise<NextResponse | null>

export type RouteHandler = (req: NextRequest) => Promise<NextResponse>
