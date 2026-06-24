#!/usr/bin/env node
/**
 * Delete a user and their profile row.
 *
 * Usage:
 *   node scripts/delete-user.mjs --email "user@example.com"
 */

import { createClient } from '@supabase/supabase-js'

try { const { config } = await import('dotenv'); config({ path: '.env.local' }) } catch {}

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

const email = arg('--email')
if (!email) {
  console.error('Usage: node scripts/delete-user.mjs --email "user@example.com"')
  process.exit(1)
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: { users }, error: listErr } = await db.auth.admin.listUsers()
if (listErr) { console.error('Could not list users:', listErr.message); process.exit(1) }

const user = users.find(u => u.email === email)
if (!user) {
  console.error(`No account found for ${email}.`)
  process.exit(1)
}

console.log(`Deleting ${email} (${user.id})…`)

// Deleting from auth.users cascades to profiles via FK
const { error } = await db.auth.admin.deleteUser(user.id)
if (error) { console.error('Failed to delete user:', error.message); process.exit(1) }

console.log(`Done. ${email} has been deleted.`)
