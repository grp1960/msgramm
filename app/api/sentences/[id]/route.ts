import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, isAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const { id } = await params

  // Only admins can delete corpus sentences; regular users can only delete recently-created ones
  const admin = await isAdmin(user!.id)
  if (!admin) {
    const { data: sentence } = await supabase
      .from('sentences')
      .select('created_at')
      .eq('id', id)
      .single()

    if (!sentence) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ageMs = Date.now() - new Date(sentence.created_at).getTime()
    const ONE_HOUR = 60 * 60 * 1000
    if (ageMs > ONE_HOUR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('sentences').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
