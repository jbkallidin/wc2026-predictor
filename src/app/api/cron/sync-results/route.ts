import { NextResponse } from 'next/server'

// Thin wrapper — delegates to the admin sync route
// Called by Vercel cron every 5 minutes during the tournament
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/sync-results`, {
    method: 'POST',
    headers: { cookie: request.headers.get('cookie') ?? '' },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
