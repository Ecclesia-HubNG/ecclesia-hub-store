import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLES } from '@/lib/roles'

function makeClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, getResponse: () => supabaseResponse }
}

// Refreshes the session cookie — used on admin auth pages (login, register, etc.)
export async function updateSession(request: NextRequest) {
  const { supabase, getResponse } = makeClient(request)
  await supabase.auth.getUser()
  return getResponse()
}

// Refreshes the session AND enforces admin role — used on all protected /admin pages
export async function updateSessionWithAdminCheck(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url)

  const { supabase, getResponse } = makeClient(request)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(loginUrl)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only redirect when we have a confirmed answer that the role is wrong.
  // A DB/network error is transient — don't log the user out for it.
  if (!profileError && (!profile?.role || !ROLES.includes(profile.role as any))) {
    return NextResponse.redirect(loginUrl)
  }

  // Build the final response. If setAll() was called during token refresh it
  // already created a new supabaseResponse — we copy its session cookies onto
  // a fresh response that carries the verified x-admin-role request header so
  // the layout can read it without a second Supabase round-trip.
  const sessionResponse = getResponse()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('x-admin-role')
  if (profile?.role) {
    requestHeaders.set('x-admin-role', profile.role)
  }

  const finalResponse = NextResponse.next({ request: { headers: requestHeaders } })
  sessionResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
    finalResponse.cookies.set(name, value, opts)
  })

  return finalResponse
}
