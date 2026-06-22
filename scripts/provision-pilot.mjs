#!/usr/bin/env node
/**
 * Activate a pilot user who has already signed up.
 *
 * Usage:
 *   node scripts/provision-pilot.mjs --email "jane@example.com"
 *   node scripts/provision-pilot.mjs --email "jane@example.com" --days 60
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Loads from .env.local automatically if dotenv is available.
 */

import { createClient } from '@supabase/supabase-js'

try {
  const { config } = await import('dotenv')
  config({ path: '.env.local' })
} catch {}

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

const email = arg('--email')
const days  = parseInt(arg('--days') ?? '30', 10)

if (!email) {
  console.error('Usage: node scripts/provision-pilot.mjs --email "user@example.com" [--days 30]')
  process.exit(1)
}

const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !svcKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, svcKey, { auth: { autoRefreshToken: false, persistSession: false } })

const today     = new Date()
const expiresAt = new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10)

console.log(`Activating pilot: ${email} — ${days} days (expires ${expiresAt})`)

// Find user by email
const { data: { users }, error: listErr } = await db.auth.admin.listUsers()
if (listErr) { console.error('Could not list users:', listErr.message); process.exit(1) }

const user = users.find(u => u.email === email)
if (!user) {
  console.error(`No account found for ${email}. They need to sign up first.`)
  process.exit(1)
}

const { error } = await db.from('profiles').update({
  license_type:               'pilot',
  expires_at:                 expiresAt,
  subscription_start:         today.toISOString().slice(0, 10),
  subscription_interval_days: days,
  updated_at:                 today.toISOString(),
}).eq('user_id', user.id)

if (error) { console.error('Failed to update profile:', error.message); process.exit(1) }

console.log(`Done. ${email} is now a pilot user, expires ${expiresAt}.`)
