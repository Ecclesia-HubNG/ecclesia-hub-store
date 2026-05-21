import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // The callback route handles code exchange server-side.
        // Disabling URL detection prevents the browser client from trying to
        // re-exchange an already-used code when it initialises on the callback page.
        detectSessionInUrl: false,
      },
    }
  )
}
