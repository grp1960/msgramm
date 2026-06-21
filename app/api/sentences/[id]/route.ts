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
  const userId = user!.id

  const admin = await isAdmin(userId)
  if (!admin) {
    const { data: sentence } = await supabase
      .from('sentences')
      .select('submitted_by')
      .eq('id', id)
      .single()

    if (!sentence) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (sentence.submitted_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('sentences').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
