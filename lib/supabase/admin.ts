import { createClient } from '@supabase/supabase-js'

// `noStore: true` forces every read through this client to bypass Next's
// fetch cache — needed for things like order-status polling, where a stale
// cached read would silently hide a real status change. Left off by
// default: applying it globally broke static generation and on-demand ISR
// for every page that touches an admin-client call anywhere in its render
// tree (e.g. the shared store layout's popup-config fetch), since a
// no-store fetch forces the whole route to be treated as dynamic.
export function createAdminClient(options?: { noStore?: boolean }) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      ...(options?.noStore ? {
        global: {
          fetch: (url, fetchOptions = {}) => fetch(url, { ...fetchOptions, cache: 'no-store' }),
        },
      } : {}),
    }
  )
}
