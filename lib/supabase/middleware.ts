import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLES } from '@/lib/roles'

function makeClient(request: NextRequest, requestHeaders: Headers) {
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
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
  const requestHeaders = new Headers(request.headers)
  const { supabase, getResponse } = makeClient(request, requestHeaders)
  await supabase.auth.getUser()
  return getResponse()
}

// Refreshes the session AND enforces admin role — used on all protected /admin pages
export async function updateSessionWithAdminCheck(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url)
  const requestHeaders = new Headers(request.headers)
  // Always clear any client-supplied role header before we set the real one
  requestHeaders.delete('x-admin-role')

  const { supabase, getResponse } = makeClient(request, requestHeaders)

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

  // Forward the verified role as a request header so the layout can read it
  // without making a second Supabase round-trip.
  if (profile?.role) {
    requestHeaders.set('x-admin-role', profile.role)
  }

  return getResponse()
}
