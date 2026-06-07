import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Called by a cron job every minute
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient()
  const { error } = await supabase.rpc('lock_due_rounds')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, time: new Date().toISOString() })
}
