import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const next      = searchParams.get('next') ?? '/account/orders'
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type')

  const fail = (msg = 'Could not sign you in. Please try again.') => {
    const u = new URL('/account', origin)
    u.searchParams.set('error', msg)
    return NextResponse.redirect(u)
  }

  // Build the redirect target first so setAll can write cookies directly onto it
  const redirectTo = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectTo.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ── OAuth PKCE flow ────────────────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
      return fail()
    }
    return redirectTo
  }

  // ── Email OTP / magic-link flow ────────────────────────────────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
    if (error) {
      console.error('[auth/callback] verifyOtp failed:', error.message)
      return fail()
    }
    return redirectTo
  }

  return NextResponse.redirect(`${origin}/account`)
}
