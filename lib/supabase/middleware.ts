import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return NextResponse.redirect(loginUrl)

  return getResponse()
}
