import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-check'
import { NextResponse } from 'next/server'

export async function GET() {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  const supabase = createClient()
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  return NextResponse.json(data ?? [])
}
