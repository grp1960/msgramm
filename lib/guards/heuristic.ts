import { NextResponse } from 'next/server'
import type { Guard } from './types'

export interface HeuristicPattern {
  test: RegExp
  message: string
}

export interface HeuristicOptions {
  /** Request body field to inspect. Default: 'sentence' */
  field?: string
  /** Override the default rejection patterns entirely. */
  patterns?: HeuristicPattern[]
}

const DEFAULT_PATTERNS: HeuristicPattern[] = [
  {
    test: /https?:\/\//i,
    message: 'URLs are not accepted. Please enter a natural language sentence.',
  },
  {
    test: /<[a-z][a-z0-9]*[\s/>]/i,
    message: 'HTML is not accepted. Please enter a natural language sentence.',
  },
]

/**
 * Fast, zero-cost guard. Rejects inputs that match known non-sentence patterns
 * (URLs, HTML tags, etc.) before any external API call is made.
 */
export function heuristicGuard(options: HeuristicOptions = {}): Guard {
  const { field = 'sentence', patterns = DEFAULT_PATTERNS } = options
  return async (req, _ctx) => {
    const body = await req.clone().json().catch(() => ({}))
    const text: string = body[field] ?? ''
    for (const { test, message } of patterns) {
      if (test.test(text)) {
        return NextResponse.json({ error: 'INVALID_INPUT', message }, { status: 422 })
      }
    }
    return null
  }
}
