import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Next.js's App Router patches the global fetch and caches requests by
      // default, even in routes marked force-dynamic. Without this override,
      // repeated reads for the same order/product (e.g. status polling) can
      // silently return a stale cached response indefinitely.
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}
