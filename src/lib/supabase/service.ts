import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses Row Level Security.
// ONLY use this in trusted server-side code (cron jobs, admin actions
// that are already authenticated via CRON_SECRET or requireAdmin()).
// Never expose the service-role key to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
