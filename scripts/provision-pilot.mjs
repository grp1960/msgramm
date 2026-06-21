#!/usr/bin/env node
/**
 * Provision a pilot user.
 *
 * Usage:
 *   node scripts/provision-pilot.mjs --name "Jane Smith" --email "jane@example.com"
 *   node scripts/provision-pilot.mjs --name "Jane Smith" --email "jane@example.com" --days 60
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Load from .env.local automatically if dotenv is available.
 */

import { createClient } from '@supabase/supabase-js'

// Load .env.local if dotenv is present
try {
  const { config } = await import('dotenv')
  config({ path: '.env.local' })
} catch {}

// ─── Args ────────────────────────────────────────────────────────────────────

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

const name  = arg('--name')
const email = arg('--email')
const days  = parseInt(arg('--days') ?? '30', 10)

if (!name || !email) {
  console.error('Usage: node scripts/provision-pilot.mjs --name "First Last" --email "user@example.com" [--days 30]')
  process.exit(1)
}

const [firstName, ...rest] = name.trim().split(' ')
const lastName = rest.join(' ') || ''

// ─── Supabase ────────────────────────────────────────────────────────────────

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !svcKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, svcKey, { auth: { autoRefreshToken: false, persistSession: false } })

// ─── Provision ───────────────────────────────────────────────────────────────

const today     = new Date()
const expiresAt = new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10)

console.log(`Provisioning pilot: ${name} <${email}> — ${days} days (expires ${expiresAt})`)

// 1. Create user + send magic link invite email
const { data: invited, error: inviteErr } = await db.auth.admin.inviteUserByEmail(email, {
  data: { first_name: firstName, last_name: lastName },
})

if (inviteErr) {
  // User may already exist — look them up
  if (!inviteErr.message.includes('already been registered')) {
    console.error('Failed to invite user:', inviteErr.message)
    process.exit(1)
  }
  console.log('User already exists — updating profile only.')
}

const userId = invited?.user?.id

if (!userId) {
  // Look up existing user by email
  const { data: { users }, error: listErr } = await db.auth.admin.listUsers()
  if (listErr) { console.error('Could not list users:', listErr.message); process.exit(1) }
  const existing = users.find(u => u.email === email)
  if (!existing) { console.error('Could not find user after invite.'); process.exit(1) }
  console.log(`Found existing user: ${existing.id}`)
  await provisionProfile(existing.id)
} else {
  await provisionProfile(userId)
}

async function provisionProfile(uid) {
  const { error } = await db.from('profiles').update({
    first_name:                firstName,
    last_name:                 lastName,
    display_name:              name.trim(),
    license_type:              'pilot',
    expires_at:                expiresAt,
    subscription_start:        today.toISOString().slice(0, 10),
    subscription_interval_days: days,
    updated_at:                today.toISOString(),
  }).eq('user_id', uid)

  if (error) {
    console.error('Failed to update profile:', error.message)
    process.exit(1)
  }

  console.log(`Done. Profile set to pilot / expires ${expiresAt}.`)
  console.log(`An invite email has been sent to ${email}.`)
}
