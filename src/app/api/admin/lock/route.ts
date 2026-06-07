import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-check'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  const supabase = createClient()
  const { matchIds } = await request.json()

  const { error } = await supabase
    .from('matches')
    .update({ status: 'locked' })
    .in('id', matchIds)
    .eq('status', 'scheduled')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
